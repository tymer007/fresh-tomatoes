// Local API server for development: runs the Vercel functions in ./api on port 5001.
// `npm run dev` starts this and Vite together; Vite proxies /api here.
// Without a Blob token, data is written to ./.data/fresh-tomatoes-data.xlsx (+ ./.data/scans/).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
for (const file of ['.env', '.env.local']) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/\s+#.*$/, '').replace(/^["']|["']$/g, '');
    }
}
if (!process.env.BLOB_READ_WRITE_TOKEN) process.env.DATA_LOCAL_DIR = path.join(ROOT, '.data');

http.createServer(async (req, res) => {
    const name = new URL(req.url, 'http://x').pathname.replace(/^\/api\//, '').replace(/\/$/, '');
    const file = path.join(ROOT, 'api', `${name}.js`);
    if (!/^[a-z-]+$/.test(name) || !fs.existsSync(file)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end('{"error":"Not found"}');
    }
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    res.status = (c) => ((res.statusCode = c), res);
    res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
    try {
        const mod = await import(pathToFileURL(file).href);
        await mod.default(req, res);
    } catch (err) {
        console.error(err);
        if (!res.writableEnded) res.status(500).json({ error: err.message });
    }
}).listen(5001, () => {
    console.log('API on http://localhost:5001  |  data:', process.env.DATA_LOCAL_DIR || 'Vercel Blob');
    console.log('Engine:', process.env.ROBOFLOW_API_KEY && process.env.ROBOFLOW_MODEL_ID ? 'Roboflow model -> AI' : 'AI vision (set ROBOFLOW_API_KEY + ROBOFLOW_MODEL_ID for the Roboflow model)');
});
