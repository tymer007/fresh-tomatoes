// One Excel workbook (fresh-tomatoes-data.xlsx) in a PRIVATE Vercel Blob store.
// Sheet "Entries": id | entryType | data | createdAt   (append-only log)
// entryType: scan | correctness | feedback | waitlist | lab
// Photos (only when the farmer ticks consent) are stored next to it under scans/<id>.jpg.
// Locally (dev-api.mjs, no Blob token) everything is written to ./.data/ instead.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import * as XLSX from 'xlsx';

const FILE = process.env.DATA_BLOB_PATH || 'fresh-tomatoes-data.xlsx';
const SHEET = 'Entries';
const COLUMNS = ['id', 'entryType', 'data', 'createdAt'];
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const LOCAL_DIR = process.env.DATA_LOCAL_DIR; // set by dev-api.mjs

export const storageEnabled = () => Boolean(LOCAL_DIR || process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

class LocalPreconditionError extends Error {}

async function readFile() {
    if (LOCAL_DIR) {
        const p = path.join(LOCAL_DIR, FILE);
        try {
            const [buffer, stat] = await Promise.all([fs.readFile(p), fs.stat(p)]);
            return { buffer, etag: `${stat.mtimeMs}-${stat.size}` };
        } catch {
            return null;
        }
    }
    const res = await get(FILE, { access: 'private', useCache: false });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return { buffer: Buffer.from(await new Response(res.stream).arrayBuffer()), etag: res.blob.etag };
}

async function writeFile(buffer, etag) {
    if (LOCAL_DIR) {
        const current = await readFile();
        if ((current?.etag || null) !== etag) throw new LocalPreconditionError();
        await fs.mkdir(LOCAL_DIR, { recursive: true });
        await fs.writeFile(path.join(LOCAL_DIR, FILE), buffer);
        return;
    }
    await put(FILE, buffer, {
        access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: XLSX_TYPE,
        cacheControlMaxAge: 60, ...(etag ? { ifMatch: etag } : {})
    });
}

export async function readEntries() {
    const file = await readFile();
    if (!file) return { rows: [], etag: null };
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[SHEET] || wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }).filter((r) => r.id).map((r) => {
        let data = {};
        try { data = JSON.parse(r.data || '{}'); } catch { /* keep empty */ }
        return { id: String(r.id), entryType: String(r.entryType), data, createdAt: String(r.createdAt) };
    });
    return { rows, etag: file.etag };
}

function build(rows) {
    const ws = XLSX.utils.aoa_to_sheet([COLUMNS, ...rows.map((r) => [r.id, r.entryType, JSON.stringify(r.data).slice(0, 32000), r.createdAt])]);
    ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 100 }, { wch: 26 }];
    ws['!autofilter'] = { ref: `A1:D${rows.length + 1}` };
    const wb = XLSX.utils.book_new();
    wb.Props = { Title: 'Fresh Tomatoes by FarmGuard - Data', Author: 'FarmGuard' };
    XLSX.utils.book_append_sheet(wb, ws, SHEET);
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function newId(prefix) {
    return `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
}

// Append one row; retries if another request saved the file at the same time.
export async function appendEntry(entryType, data, id = newId(entryType.slice(0, 3))) {
    if (!storageEnabled()) return null;
    for (let attempt = 0; attempt < 5; attempt++) {
        const { rows, etag } = await readEntries();
        rows.push({ id, entryType, data, createdAt: new Date().toISOString() });
        try {
            await writeFile(build(rows), etag);
            return id;
        } catch (err) {
            if (!(err instanceof BlobPreconditionFailedError || err instanceof LocalPreconditionError)) throw err;
            await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
        }
    }
    throw new Error('Data file busy');
}

export async function savePhoto(id, base64, mime) {
    if (!storageEnabled()) return null;
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const name = `scans/${id}.${ext}`;
    const bytes = Buffer.from(base64, 'base64');
    if (LOCAL_DIR) {
        await fs.mkdir(path.join(LOCAL_DIR, 'scans'), { recursive: true });
        await fs.writeFile(path.join(LOCAL_DIR, name), bytes);
    } else {
        await put(name, bytes, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: mime });
    }
    return name;
}

export async function downloadWorkbook() {
    return (await readFile())?.buffer || null;
}

export { XLSX_TYPE, FILE };
