// POST /api/detect - tomato leaf diagnosis.
// Pipeline: Roboflow tomato disease model (image detection) -> AI writes the advice.
// If ROBOFLOW_API_KEY / ROBOFLOW_MODEL_ID are not set, the AI vision model does the detection too.
// Low-confidence results are returned as "not sure" instead of a guess.
import { readBody, originAllowed, takeQuota, LIMIT_MESSAGE, callAI, ADVICE_RULES, AI_VISION_MODEL } from './_lib/common.js';
import { appendEntry, savePhoto, newId } from './_lib/store.js';

const RF_KEY = process.env.ROBOFLOW_API_KEY;
const RF_MODEL = process.env.ROBOFLOW_MODEL_ID; // e.g. "tomato-leaf-diseases/1"
const RF_URL = (process.env.ROBOFLOW_API_URL || 'https://detect.roboflow.com').replace(/\/$/, '');
const MIN_CONFIDENCE = Number(process.env.MIN_CONFIDENCE || 0.5); // below this we say "not sure"

export const roboflowEnabled = () => Boolean(RF_KEY && RF_MODEL);

// "Tomato___Early_blight" / "early-blight" -> "Early blight"
function prettyLabel(label) {
    const s = String(label || '').replace(/^tomato[\s_-]*/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : 'Unknown';
}

// Accepts detection, single-label and multi-label classification responses.
function normalizePredictions(data) {
    let list = [];
    if (Array.isArray(data?.predictions)) list = data.predictions.map((p) => ({ label: p.class, confidence: Number(p.confidence) }));
    else if (data?.predictions && typeof data.predictions === 'object') {
        list = Object.entries(data.predictions).map(([label, v]) => ({ label, confidence: Number(v?.confidence ?? v) }));
    }
    if (!list.length && data?.top) list = [{ label: data.top, confidence: Number(data.confidence) }];
    // Merge duplicate labels (several boxes of the same disease) keeping the highest confidence.
    const best = new Map();
    for (const p of list) if (!best.has(p.label) || best.get(p.label).confidence < p.confidence) best.set(p.label, p);
    return [...best.values()].sort((a, b) => b.confidence - a.confidence).map((p) => ({ label: prettyLabel(p.label), raw: p.label, confidence: p.confidence }));
}

async function runRoboflow(base64) {
    const res = await fetch(`${RF_URL}/${RF_MODEL}?api_key=${encodeURIComponent(RF_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: base64
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.error('[roboflow]', res.status, json);
        throw Object.assign(new Error('The detection model is unavailable right now. Please try again shortly.'), { status: 502 });
    }
    return normalizePredictions(json);
}

const RESULT_SCHEMA = {
    name: 'tomato_result',
    schema: {
        type: 'object',
        properties: {
            isTomatoLeaf: { type: 'boolean', description: 'False if the photo is not a tomato plant/leaf or is too unclear to judge.' },
            disease: { type: 'string', description: 'Disease or problem name, or "Healthy".' },
            confidence: { type: 'integer', description: '0-100: how sure you are. Be honest; blurry or unusual photos should score low.' },
            severity: { type: 'string', enum: ['none', 'low', 'moderate', 'high'] },
            summary: { type: 'string', description: '1-2 sentences on what the photo shows.' },
            steps: { type: 'array', items: { type: 'string' }, description: '3-5 short steps to take now.' },
            treatment: { type: 'string', description: 'Treatment: cultural/organic first, then NAFDAC-registered active ingredients if needed. Empty if healthy.' },
            prevention: { type: 'array', items: { type: 'string' }, description: '2-3 ways to prevent it next time.' }
        },
        required: ['isTomatoLeaf', 'disease', 'confidence', 'severity', 'summary', 'steps', 'treatment', 'prevention'],
        additionalProperties: false
    }
};

const VISION_PROMPT = `${ADVICE_RULES}\nDiagnose tomato leaf diseases from the photo. Common ones: early blight, late blight, Septoria leaf spot, bacterial spot, leaf mold, target spot, yellow leaf curl virus, mosaic virus, spider mites, leaf miner, or healthy. If you are not confident, give a low confidence - the app will ask for a better photo instead of guessing.`;

function visionDiagnosis(image, context) {
    return callAI({
        model: AI_VISION_MODEL,
        schema: RESULT_SCHEMA,
        maxTokens: 1500,
        messages: [
            { role: 'system', content: VISION_PROMPT },
            { role: 'user', content: [
                { type: 'text', text: `Farmer's notes: ${context || 'none'}. Diagnose this tomato leaf.` },
                { type: 'image_url', image_url: { url: image, detail: 'auto' } }
            ] }
        ]
    });
}

// Compare disease names from different sources ("Septoria leaf spot" == "Septoria", etc.)
const CANONICAL = ['healthy', 'early blight', 'late blight', 'septoria', 'bacterial spot', 'leaf mold', 'target spot', 'yellow leaf curl', 'mosaic', 'spider mite', 'leaf miner', 'powdery mildew', 'fusarium', 'bacterial wilt'];
function canonical(name) {
    const n = String(name || '').toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
    return CANONICAL.find((c) => n.includes(c)) || n;
}

function healthScore(disease, confidence, severity) {
    if (/healthy/i.test(disease)) return Math.round(80 + 20 * confidence);
    const base = { none: 85, low: 70, moderate: 50, high: 25 }[severity] ?? 50;
    return Math.max(5, Math.min(90, Math.round(base - (confidence - 0.5) * 20)));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!originAllowed(req)) return res.status(403).json({ error: 'Origin not allowed' });

    const body = readBody(req);
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ''));
    if (!match) return res.status(400).json({ error: 'Please upload a JPEG, PNG or WebP photo.' });
    const [, mime, base64] = match;
    if (base64.length > 7_000_000) return res.status(413).json({ error: 'Photo is too large (max 5 MB).' });
    if (!takeQuota('scans', req, body.deviceId)) return res.status(429).json({ error: LIMIT_MESSAGE.scans, limit: true });

    const context = String(body.context || '').slice(0, 500);
    const engine = roboflowEnabled() ? 'roboflow+ai' : 'ai';
    try {
        let detections = [];
        let result;

        if (engine === 'roboflow+ai') {
            // Step 1 (in parallel): the image detection model, and a BLIND second opinion from the
            // vision AI, which does not see the model's answer, so it can't just agree with it.
            const [rf, blind] = await Promise.all([runRoboflow(base64), visionDiagnosis(body.image, context)]);
            detections = rf;
            const top = detections[0];
            const blindConf = Math.max(0, Math.min(100, Number(blind.confidence) || 0)) / 100;
            const modelDisease = top ? top.label : 'Healthy';
            const conf = top ? top.confidence : 0.9;
            if (top && top.confidence < MIN_CONFIDENCE) {
                result = { sure: false, disease: top.label, confidence: top.confidence, reason: 'low_confidence' };
            } else if (blind.isTomatoLeaf === false) {
                result = { sure: false, disease: 'Not a tomato leaf', confidence: conf, reason: 'not_tomato' };
            } else if (canonical(blind.disease) !== canonical(modelDisease) && blindConf >= MIN_CONFIDENCE) {
                // Step 2: the two independent checks disagree -> don't guess
                result = { sure: false, disease: modelDisease, confidence: conf, reason: 'disagreement', secondOpinion: prettyLabel(blind.disease) };
            } else if (canonical(blind.disease) === canonical(modelDisease)) {
                // Step 2: both agree -> use the vision AI's advice for this diagnosis
                result = { ...blind, sure: true, disease: modelDisease, confidence: conf };
            } else {
                // Second opinion was unsure: trust the model and write advice for its diagnosis
                const advice = await callAI({
                    schema: RESULT_SCHEMA,
                    maxTokens: 1500,
                    messages: [
                        { role: 'system', content: `${ADVICE_RULES}\nA trained tomato leaf disease detection model diagnosed the photo. Write the result and advice for that diagnosis.` },
                        { role: 'user', content: `Diagnosis: ${modelDisease} (${Math.round(conf * 100)}% confidence).\nFarmer's notes: ${context || 'none'}.` }
                    ]
                });
                result = { ...advice, sure: true, disease: modelDisease, confidence: conf };
            }
        } else {
            // AI vision model does detection + advice in one pass
            const ai = await visionDiagnosis(body.image, context);
            const conf = Math.max(0, Math.min(100, Number(ai.confidence) || 0)) / 100;
            result = !ai.isTomatoLeaf
                ? { sure: false, disease: 'Not a tomato leaf', confidence: conf, reason: 'not_tomato' }
                : conf < MIN_CONFIDENCE
                    ? { sure: false, disease: ai.disease, confidence: conf, reason: 'low_confidence' }
                    : { ...ai, sure: true, confidence: conf };
            detections = [{ label: ai.disease, confidence: conf }];
        }

        if (result.sure) result.healthScore = healthScore(result.disease, result.confidence, result.severity);
        const scanId = newId('scan');
        const payload = {
            engine, sure: result.sure, reason: result.reason || null, secondOpinion: result.secondOpinion || null, disease: result.disease, confidence: Math.round(result.confidence * 100),
            healthScore: result.healthScore ?? null, severity: result.severity || null, summary: result.summary || '',
            steps: result.steps || [], treatment: result.treatment || '', prevention: result.prevention || [],
            detections: detections.slice(0, 3).map((d) => ({ label: d.label, confidence: Math.round(d.confidence * 100) })),
            scanId
        };

        // Record the scan (photo only with consent). A logging failure never breaks the answer.
        try {
            const photo = body.consent ? await savePhoto(scanId, base64, mime) : null;
            await appendEntry('scan', {
                engine, disease: payload.disease, confidence: payload.confidence, healthScore: payload.healthScore, sure: payload.sure,
                reason: payload.reason, secondOpinion: payload.secondOpinion,
                context, state: String(body.state || '').slice(0, 40), sample: body.sample || null, consent: !!body.consent, photo
            }, scanId);
        } catch (err) {
            console.error('[detect] log failed', err.message);
        }

        return res.status(200).json(payload);
    } catch (err) {
        console.error('[detect]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Analysis failed' });
    }
}
