// Shared helpers for the API functions: AI Gateway calls, limits, request guards.

export const LIMITS = {
    scans: Number(process.env.FREE_SCANS_PER_DAY || 3),
    chats: Number(process.env.FREE_CHATS_PER_DAY || 3)
};

// Free-tier AI Gateway models (newer ones need paid credits - see README).
// AI_MODEL: chat + writing advice after the Roboflow model has diagnosed (cheap, fast).
// AI_VISION_MODEL: used for diagnosis only when the Roboflow model is not configured
// (in our test it named 4/4 sample diseases correctly; the lite model got 2/4).
export const AI_MODEL = process.env.AI_MODEL || 'google/gemini-2.5-flash-lite';
export const AI_VISION_MODEL = process.env.AI_VISION_MODEL || 'google/gemini-2.5-flash';
const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const THINKING = /gpt-5|gemini-2\.5-flash$|gemini-2\.5-pro/;

export function readBody(req) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
}

export function clientIp(req) {
    return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'local';
}

export function originAllowed(req) {
    const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const origin = req.headers.origin || '';
    return !allowed.length || !origin || allowed.includes(origin);
}

// Server-side daily limit per IP + device (best effort: resets if the function instance recycles).
// The page also counts per device in localStorage; a request needs both under the limit.
const usage = new Map();
export function takeQuota(kind, req, deviceId) {
    const day = new Date().toISOString().slice(0, 10);
    const keys = [`${day}:${kind}:ip:${clientIp(req)}`, `${day}:${kind}:dev:${String(deviceId || 'none').slice(0, 64)}`];
    const limit = LIMITS[kind] * 2; // IPs can be shared (e.g. mobile networks), so allow some headroom per IP
    if ((usage.get(keys[0]) || 0) >= limit || (usage.get(keys[1]) || 0) >= LIMITS[kind]) return false;
    keys.forEach((k) => usage.set(k, (usage.get(k) || 0) + 1));
    if (usage.size > 5000) usage.clear();
    return true;
}

export const LIMIT_MESSAGE = {
    scans: `You've used today's ${LIMITS.scans} free scans. Come back tomorrow - FarmGuard Pro (₦2,500/month) with more scans is coming soon.`,
    chats: `You've used today's ${LIMITS.chats} free chat messages. Come back tomorrow - FarmGuard Pro (₦2,500/month) is coming soon.`
};

export async function callAI({ messages, schema, maxTokens = 1500, temperature = 0.3, model = AI_MODEL }) {
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!apiKey) throw Object.assign(new Error('AI is not configured yet. Add AI_GATEWAY_API_KEY in the Vercel project settings.'), { status: 503 });
    const res = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model, messages, temperature, stream: false,
            // Reasoning models count their thinking toward max_tokens: keep it low and leave room.
            max_tokens: THINKING.test(model) ? Math.max(maxTokens, 6000) : maxTokens,
            ...(THINKING.test(model) ? { reasoning: { effort: 'low', exclude: true } } : {}),
            ...(schema ? { response_format: { type: 'json_schema', json_schema: schema } } : {})
        })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const detail = String(json?.error?.message || '');
        console.error('[ai]', res.status, detail);
        const msg = res.status === 401 ? 'AI key is invalid.'
            : /free tier/i.test(detail) ? `The model ${AI_MODEL} needs paid AI Gateway credits - use a free-tier model.`
            : res.status === 429 ? 'The AI service is busy. Please try again in a minute.'
            : 'The AI service had a problem. Please try again.';
        throw Object.assign(new Error(msg), { status: 502 });
    }
    const choice = json.choices?.[0];
    if (choice?.finish_reason === 'length') throw Object.assign(new Error('The AI answer was cut off. Please try again.'), { status: 502 });
    const content = choice?.message?.content || '';
    if (!schema) return content.trim();
    try {
        return JSON.parse(content);
    } catch {
        const m = content.match(/\{[\s\S]*\}/);
        if (m) return JSON.parse(m[0]);
        throw Object.assign(new Error('The AI returned an unreadable answer. Please try again.'), { status: 502 });
    }
}

export const ADVICE_RULES = `You are FarmGuard's tomato plant health expert helping farmers in Nigeria. Talk directly to the farmer ("your plant", "your farm").
Use short, practical steps in plain English. Prefer affordable, locally available options and cultural practices first.
When you mention a chemical, name only the active ingredient and product types that are registered with NAFDAC in Nigeria, and tell the farmer to buy registered products from a licensed agro-dealer and follow the label.
Never invent certainty. For serious outbreaks, advise contacting an agricultural extension officer.`;
