# Admin Panel

Admin panel for managing the [Articles & Gallery Google Sheet](https://docs.google.com/spreadsheets/d/1sY7_eNfVYkKDoS3SXm1ft2luVwKsN59orsIjehfV9Xs/edit).

- **Articles** tab — full CRUD (add / edit / delete rows: category, source, date, title, description, link_text, url).
- **Gallery** tab — upload images (stored on Cloudinary, URL saved to the sheet), move them between `local`/`international`, and delete them.
- **Bio** tab — full CRUD for Name / Birthday / World Rank. Age is never entered manually — it's calculated from Birthday on every read and write, so it can't go stale.

Reads go through the sheet's public XLSX export (no credentials needed — the
sheet must stay shared as "Anyone with the link can view"). Writes go through
the Google Sheets API using a service account. Image uploads go directly from
the browser to Cloudinary via an unsigned upload preset.

There is currently **no login screen** — anyone with the deployed URL can
edit the sheet. Add auth before sharing the link widely.

## 1. Create a Google service account (write access)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create/select a project.
2. Enable the **Google Sheets API** for that project (APIs & Services → Enable APIs → search "Google Sheets API").
3. Go to APIs & Services → Credentials → Create Credentials → **Service account**. Give it any name (e.g. `sheet-writer`).
4. Open the new service account → Keys → Add Key → Create new key → **JSON**. This downloads a JSON file — keep it private.
5. From that JSON file, copy `client_email` and `private_key`.
6. Open the [spreadsheet](https://docs.google.com/spreadsheets/d/1sY7_eNfVYkKDoS3SXm1ft2luVwKsN59orsIjehfV9Xs/edit), click **Share**, and add the `client_email` address as **Editor**.
7. Confirm the sheet is also shared as "Anyone with the link — Viewer" (needed for the read path).

## 2. Create a Cloudinary unsigned upload preset

1. Sign in to [Cloudinary](https://cloudinary.com/console) and note your **Cloud name** (dashboard home).
2. Go to Settings → Upload → Upload presets → **Add upload preset**.
3. Set **Signing Mode** to **Unsigned**, optionally restrict the folder to `gallery`, and save. Note the preset name.
4. (Optional, for deleting images) Go to Settings → Access Keys and note your **API Key** and **API Secret**.

## 3. Configure environment variables

Copy `.env.example` to `.env` and fill in the values from steps 1–2:

```
cp .env.example .env
```

| Variable | Used by | Purpose |
| --- | --- | --- |
| `SHEET_ID` | backend | Spreadsheet ID (already filled in) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | backend | Service account email |
| `GOOGLE_PRIVATE_KEY` | backend | Service account private key |
| `CLOUDINARY_CLOUD_NAME` | backend | For server-side deletes |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | backend | For server-side deletes |
| `REACT_APP_CLOUDINARY_CLOUD_NAME` | frontend | For direct browser uploads |
| `REACT_APP_CLOUDINARY_UPLOAD_PRESET` | frontend | For direct browser uploads |

## 4. Run locally

```
npm install
npm run dev
```

This runs the React dev server (port 3000) and a small local API server
(port 5001, defined in `server/dev.js`) together — CRA's `proxy` setting
forwards `/api/*` calls from the browser to it. Open http://localhost:3000.

`server/dev.js` only exists for local development; it's not used in
production.

## 5. Deploy (Vercel)

The `/api` folder is deployed automatically as serverless functions — no
extra config needed.

```
npm install -g vercel   # if you don't have it
vercel                  # first deploy, follow the prompts to link/create a project
```

Then in the Vercel project dashboard, add all the variables from `.env` under
Settings → Environment Variables, and redeploy.

## 5b. Deploy (Netlify)

Netlify's drag-and-drop "upload a build folder" flow only serves static
files — it can't run the `/api` backend, so add/edit/delete/upload would all
404. `netlify/functions/` adapts the same `api/*.js` handlers to run as real
Netlify Functions instead, and `netlify.toml` rewrites `/api/*` to them so
the frontend code doesn't need to change. This means deploying with the
**Netlify CLI** rather than pure drag-and-drop — still a single command:

```
npm install
netlify login                 # one-time, opens a browser to authenticate
netlify init                  # link this folder to a new or existing Netlify site
```

Then add the same variables from `.env` in the Netlify dashboard (Site
configuration → Environment variables), or via the CLI:

```
netlify env:import .env
```

Then deploy:

```
npm run deploy:netlify         # builds and deploys to production
```

To test the whole thing (frontend + functions + redirects) locally before
deploying, run `npm run netlify:dev` — it serves both together on one port,
similar to `npm run dev` but through Netlify's own dev server.

## Project structure

```
api/                  Handler logic, shared by Vercel + Netlify + local dev
  _lib/sheet.js        Public-export read helper
  _lib/sheetsClient.js Google Sheets API (service account) write helper
  _lib/cloudinary.js   Cloudinary delete helper
  articles.js          GET/POST/PUT/DELETE for the Articles tab
  gallery.js           GET/POST/PATCH/DELETE for the Gallery tab
  bio.js               GET/POST/PUT/DELETE for the Bio tab
netlify/functions/    Thin adapters that run api/*.js as Netlify Functions
netlify.toml          Netlify build config + /api/* → functions redirect
server/dev.js         Local-only Express server that mounts the api/ handlers
src/
  api/client.js        Frontend fetch wrappers + Cloudinary upload
  components/          Layout, Modal
  pages/                ArticlesPage, GalleryPage, BioPage
```
