// POST /api/chat - "Ask FarmGuard" chat (3 free messages per day).
import { readBody, originAllowed, takeQuota, LIMIT_MESSAGE, callAI, ADVICE_RULES } from './_lib/common.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!originAllowed(req)) return res.status(403).json({ error: 'Origin not allowed' });
    const body = readBody(req);

    const history = (Array.isArray(body.messages) ? body.messages : [])
        .slice(-6)
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
    if (!history.length || history[history.length - 1].role !== 'user') return res.status(400).json({ error: 'Please type a question.' });
    if (!takeQuota('chats', req, body.deviceId)) return res.status(429).json({ error: LIMIT_MESSAGE.chats, limit: true });

    const scan = body.scan && typeof body.scan === 'object'
        ? `The farmer's latest scan: ${JSON.stringify({ disease: body.scan.disease, confidence: body.scan.confidence, healthScore: body.scan.healthScore, sure: body.scan.sure }).slice(0, 600)}`
        : 'The farmer has not scanned a plant yet.';
    try {
        const reply = await callAI({
            maxTokens: 700,
            temperature: 0.5,
            messages: [
                { role: 'system', content: `${ADVICE_RULES}\nYou are the "Ask FarmGuard" assistant on the Fresh Tomatoes website. Answer questions about growing tomatoes and tomato pests/diseases. Keep answers under 120 words, plain text with short "- " bullet lines. If asked about other crops, answer briefly and say more crops are coming to FarmGuard.\n${scan}` },
                ...history
            ]
        });
        return res.status(200).json({ reply });
    } catch (err) {
        return res.status(err.status || 500).json({ error: err.message });
    }
}
