# GLOW · 2026 Draft — Railway deployment

Draft engine for the Glorious League of Warriors. Everything runs client-side
except the news sweep, which is proxied so an API key never reaches the browser.

## Deploy

**Option A — GitHub (recommended, gives you auto-deploy on push)**

```bash
unzip glow-draft-railway.zip && cd glow-draft
git init && git add -A && git commit -m "glow draft"
gh repo create glow-draft --private --source=. --push     # or push to a repo you made in the UI
```

Then in Railway: **New Project → Deploy from GitHub repo → glow-draft**.
It reads `railway.json`, runs `npm ci && npm run build`, starts `npm start`.

**Option B — straight from your machine, no GitHub**

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

## The one setting

In Railway → your service → **Variables**, add:

```
ANTHROPIC_API_KEY = <your key from console.anthropic.com>
```

Set it yourself in that panel — don't commit it, and don't paste it into any
file here. Add it and Railway redeploys on its own.

**The app works fine without it.** Every projection, simulation, verdict and the
whole board run in the browser. Only the "News" button needs the key; without
one it returns a clean "news checking is off" message and nothing else changes.

Then Railway → **Settings → Networking → Generate Domain** for a public URL.
Open it on your phone and add to home screen.

## Local

```bash
npm install
npm run build && npm start      # http://localhost:3000
```

## What lives where

- `src/App.jsx` — the entire engine and UI, including the board data
- `server.js` — static file serving + `POST /api/news` proxy + `/healthz`
- `railway.json` — build and start commands, health check

## How you use it

Two buttons, nothing else to track:

- **mine** — you drafted him
- **gone** — anyone else drafted him

Log every pick as it happens and the pick counter stays in sync on its own. Set
your seat (teams + your pick number) once in **Setup**; there are no team names.

## Notes

- Draft state saves to `localStorage` under `glow:solo1`, debounced ~700ms.
  It survives a refresh, but it is **per-device and per-browser** — draft on one
  phone, not two.
- Clearing site data wipes the draft. There's a Reset in Setup if you want it gone.
- The board is current to 21 Aug 2026. Projections move all preseason; the News
  button re-prices individual players but does not refresh the base projections.
