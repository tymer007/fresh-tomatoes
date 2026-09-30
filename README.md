# Fresh Tomatoes by FarmGuard

Photograph a tomato leaf, get the disease, a confidence score, a health score and simple next steps.

```
frontend/
  src/            React site (Vite + Tailwind)
  api/            Vercel functions: detect, chat, feedback, status
  public/samples  Sample leaf photos (Wikimedia Commons, credited in the footer)
  dev-api.mjs     Runs the api/ functions locally
```

## How a scan works

1. **Image detection model (Roboflow).** At the same time, a **blind second opinion** from a vision AI runs. It does not see the model's answer.
2. If the model's confidence is below `MIN_CONFIDENCE` (50%), or the two disagree, or the photo isn't a tomato leaf, the site says **"We're not sure. Try a clearer photo."** instead of guessing.
3. If they agree, FarmGuard AI's advice is shown: steps, treatment (NAFDAC-registered products only) and prevention.

Without Roboflow keys, the vision AI does the diagnosis alone, still with a confidence check. `/api/status` reports which engine is active.

**Tested 30 Sep 2026 on the 4 sample photos.**
- The Roboflow model was right on healthy, early blight and late blight.
- It called Septoria leaf spot "Late blight" (94%). The blind check caught this, and the site answered "not sure".

## Run locally

```bash
cd frontend
npm install
cp .env.example .env.local     # fill in the keys below
npm run dev                    # http://localhost:5173  (API on :5001)
```

Without a Blob token, data is written to `frontend/.data/fresh-tomatoes-data.xlsx`, which you can open in Excel. `.data` and `.env.local` are git-ignored.

## Deploy on Vercel (step by step)

1. **Project settings.** Import `tymer007/fresh-tomatoes`. Set **Root Directory = `frontend`** and Framework = **Vite**. The `api/` folder deploys automatically as functions.
2. **Environment variables** (Project → Settings → Environment Variables, for Production + Preview):

   | Variable | Value |
   |---|---|
   | `AI_GATEWAY_API_KEY` | Same key as Agrosphere (Vercel → AI Gateway → API Keys) |
   | `ROBOFLOW_API_KEY` | Your Roboflow API key |
   | `ROBOFLOW_MODEL_ID` | `tomato-leaf-diseases-detection-4kjiy-z0qoh/1` |
   | `ADMIN_KEY` | A password you choose, used to download the data file |
   | `ALLOWED_ORIGINS` | *(optional)* `https://your-site.vercel.app`, which stops other sites using your API |

   Optional variables, with their defaults:
   - `AI_MODEL=google/gemini-2.5-flash-lite` (chat)
   - `AI_VISION_MODEL=google/gemini-2.5-flash` (diagnosis check)
   - `MIN_CONFIDENCE=0.5`
   - `FREE_SCANS_PER_DAY=3`
   - `FREE_CHATS_PER_DAY=3`

   Both default AI models work on AI Gateway's **free tier**. Newer models such as gemini-3 need paid credits and return 403.
3. **Blob storage for the data file.** Go to Project → **Storage → Create → Blob** and fill in:
   - Name: `fresh-tomatoes-data`
   - Region: closest to your users
   - Access: **Private**
   - Custom Environment Variable Prefix: **`BLOB`**. This is a prefix, not the full name.
   - **Tick** "Add a read-write token env var to this connection", so that `BLOB_READ_WRITE_TOKEN` is created.
4. **Redeploy**, then open `https://<site>/api/status`. It should show `"engine":"roboflow+ai"` and `"storage":true`.
5. **Analytics** *(optional)*: Project → Analytics → Enable. The code is already included.

The old `backend/` Express server is no longer needed. Delete its separate deployment (and its Roboflow and Gemini keys) once the new site is live.

## Where the data goes

There is one private Excel file in Blob, `fresh-tomatoes-data.xlsx`, with the sheet `Entries` (`id | entryType | data | createdAt`).

| entryType | Saved when |
|---|---|
| `scan` | Every analysis: disease, confidence, health score, "not sure" reason, state, and consent yes/no |
| `correctness` | A farmer taps "Was this correct?" (Yes / No / Not sure) |
| `waitlist` | Waitlist sign-up: email (+ optional WhatsApp). Duplicate emails are ignored. |
| `feedback` | Star rating + message |

Photos are stored **only when the consent box is ticked**, at `scans/<scanId>.jpg` in the same private Blob store.

**Download the file:** `https://<site>/api/status?download&key=<ADMIN_KEY>`, or use Vercel → Storage → Browser. Treat downloads as read-only snapshots; the site owns the live file.

## Free plan limits

- 3 scans and 3 chat messages a day.
- Counted in the browser and on the server (per device and per internet connection). The server count is best-effort and resets when a function restarts.
- The Pro plan (₦2,500/month) is shown as "Subscription coming soon".
