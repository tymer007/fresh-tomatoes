// GET /api/status                        -> which engine is active, limits, waitlist count
// GET /api/status?download&key=ADMIN_KEY -> download the data file (fresh-tomatoes-data.xlsx) to open in Excel
import { LIMITS, AI_MODEL, AI_VISION_MODEL } from './_lib/common.js';
import { readEntries, storageEnabled, downloadWorkbook, XLSX_TYPE, FILE } from './_lib/store.js';
import { roboflowEnabled } from './detect.js';

let cache = { at: 0, waitlist: 0 };

export default async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    if (url.searchParams.has('download')) {
        if (!process.env.ADMIN_KEY || url.searchParams.get('key') !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Invalid key' });
        const file = await downloadWorkbook();
        if (!file) return res.status(404).json({ error: 'No data yet' });
        res.setHeader('Content-Type', XLSX_TYPE);
        res.setHeader('Content-Disposition', `attachment; filename="${FILE}"`);
        return res.status(200).end(file);
    }

    if (storageEnabled() && Date.now() - cache.at > 60_000) {
        try {
            const { rows } = await readEntries();
            cache = { at: Date.now(), waitlist: rows.filter((r) => r.entryType === 'waitlist').length };
        } catch (err) {
            console.error('[status]', err.message);
        }
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
        engine: roboflowEnabled() ? 'roboflow+ai' : 'ai',
        aiModel: AI_MODEL,
        visionModel: roboflowEnabled() ? null : AI_VISION_MODEL,
        storage: storageEnabled(),
        limits: LIMITS,
        waitlistCount: cache.waitlist
    });
}
