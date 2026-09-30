// POST /api/feedback - saves "Was this correct?", feedback, waitlist and lab enquiries to the data file.
import { readBody, originAllowed } from './_lib/common.js';
import { appendEntry, storageEnabled, readEntries } from './_lib/store.js';

const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9\s-]{7,16}$/;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!originAllowed(req)) return res.status(403).json({ error: 'Origin not allowed' });
    const b = readBody(req);
    let data;
    switch (b.type) {
        case 'correctness':
            if (!['yes', 'no', 'not_sure'].includes(b.answer)) return res.status(400).json({ error: 'Invalid answer' });
            data = { scanId: clip(b.scanId, 40), answer: b.answer, disease: clip(b.disease, 80) };
            break;
        case 'feedback':
            if (!(b.rating >= 1 && b.rating <= 5)) return res.status(400).json({ error: 'Please pick a rating' });
            data = { rating: Number(b.rating), message: clip(b.message, 1000) };
            break;
        case 'waitlist': {
            const email = clip(b.email, 120).toLowerCase();
            const whatsapp = clip(b.whatsapp, 20);
            if (!EMAIL.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
            if (whatsapp && !PHONE.test(whatsapp)) return res.status(400).json({ error: 'That WhatsApp number looks wrong - include the country code, e.g. +234...' });
            data = { email, whatsapp, interests: (Array.isArray(b.interests) ? b.interests : []).slice(0, 10).map((x) => clip(x, 30)) };
            break;
        }
        case 'lab':
            if (!EMAIL.test(clip(b.email, 120)) || !clip(b.message, 10)) return res.status(400).json({ error: 'Add your email and a short message' });
            data = { name: clip(b.name, 80), organisation: clip(b.organisation, 120), email: clip(b.email, 120), message: clip(b.message, 1500) };
            break;
        default:
            return res.status(400).json({ error: 'Unknown feedback type' });
    }
    if (!storageEnabled()) return res.status(200).json({ ok: true, stored: false });
    try {
        if (b.type === 'waitlist') {
            const { rows } = await readEntries();
            if (rows.some((r) => r.entryType === 'waitlist' && r.data.email === data.email)) return res.status(200).json({ ok: true, stored: true, duplicate: true });
        }
        await appendEntry(b.type, data);
        return res.status(200).json({ ok: true, stored: true });
    } catch (err) {
        console.error('[feedback]', err);
        return res.status(500).json({ error: 'Could not save right now. Please try again.' });
    }
}
