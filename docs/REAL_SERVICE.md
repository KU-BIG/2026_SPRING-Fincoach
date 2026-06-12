# Real-service deployment (Render backend + Cloudflare Pages frontend)

Two independent environments are kept side by side:

| Environment | Frontend | Backend | Data |
|---|---|---|---|
| Demo (existing) | `fincoach-18i.pages.dev` (project `fincoach`) | none | demo fallback only |
| Real service (this doc) | `fincoach.bsghcal.com` (project `fincoach-app`) | Render (`api.bsghcal.com`) | live API, real LLM once the key is set |

The demo is never touched. The real service is a separate Cloudflare Pages
project whose build points at a live backend via `VITE_API_BASE`.

```
fincoach.bsghcal.com  (Cloudflare Pages: fincoach-app)
        |  VITE_API_BASE = https://api.bsghcal.com
        v
api.bsghcal.com  (Cloudflare DNS CNAME -> Render)
        v
fincoach-api.onrender.com  (Render web service, Python FastAPI)
```

Both layers run in demo mode until `ANTHROPIC_API_KEY` is set on Render. Wiring
the infrastructure first (no key) is intentional: once the key is added and the
service restarts, the same live frontend flips to real answers automatically.

---

## Part A — Backend on Render

Render runs the Python FastAPI backend (Cloudflare Pages/Workers cannot run
Python). The repo ships a Blueprint at `render.yaml`.

1. Render dashboard -> **New** -> **Blueprint**.
2. Connect this GitHub repo. Render reads `render.yaml` and proposes a web
   service `fincoach-api` (free plan, Singapore region, build `pip install .`,
   start `uvicorn api.main:app --host 0.0.0.0 --port $PORT`, health check
   `/api/health`).
3. Apply. First build pulls pandas/pykrx/yfinance, so it takes a few minutes.
4. When live, note the service URL, e.g. `https://fincoach-api.onrender.com`.
   Verify: `curl https://fincoach-api.onrender.com/api/health` -> `{"status":"ok"}`.

Free plan note: the service sleeps after ~15 min idle; the next request cold
starts in 30-50 s. Hit `/api/health` once before a demo to wake it, or upgrade
to a paid instance to keep it always on.

### Custom domain `api.bsghcal.com`

1. Render service -> **Settings** -> **Custom Domains** -> add `api.bsghcal.com`.
   Render shows a CNAME target (the `onrender.com` host).
2. Cloudflare DNS for `bsghcal.com` -> add record:
   `CNAME  api  ->  fincoach-api.onrender.com`, **DNS only (grey cloud)** so
   Render serves its own TLS cert. (If proxied/orange, set SSL mode to Full.)
3. Wait for Render to mark the domain Verified + certificate issued.

---

## Part B — Frontend on Cloudflare Pages

The workflow `.github/workflows/deploy-app.yml` deploys a separate Pages project
`fincoach-app`, built with `VITE_API_BASE` from the repo Variable `APP_API_BASE`.
It runs on push to `main` (paths `web/**`) and via manual dispatch. The demo
workflow `deploy-web.yml` is unchanged.

1. Set the backend URL as a repo Variable (not a secret — it is public anyway):
   - GitHub -> Settings -> Secrets and variables -> Actions -> **Variables** ->
     New variable: `APP_API_BASE` = `https://api.bsghcal.com`
     (or the `onrender.com` URL until the custom domain is ready).
   - Or via CLI: `gh variable set APP_API_BASE --body "https://api.bsghcal.com"`
2. Trigger the deploy: push to `main`, or
   `gh workflow run deploy-app.yml --ref main`.
3. First run creates the `fincoach-app` Pages project. Find its `*.pages.dev`
   URL in the run log or the Cloudflare Pages dashboard.

### Custom domain `fincoach.bsghcal.com`

Cloudflare Pages project `fincoach-app` -> **Custom domains** -> add
`fincoach.bsghcal.com`. Because `bsghcal.com` DNS is already on Cloudflare, the
record is created automatically. No extra DNS step.

---

## Part C — Turn on real data (add the LLM key)

The Anthropic key is not in the repo. Get it from the chat module owner (Subin,
who ran the smoke test locally) or issue a new one.

1. Render service -> **Environment** -> add secret `ANTHROPIC_API_KEY` = `sk-ant-...`.
2. Render redeploys. Now `/api/chat/stream` returns real Claude answers and
   `/api/portfolio/analysis` returns a real report.
3. No frontend change needed: the React source badge flips from "데모 응답" to
   "실시간 응답" on its own because the backend stops sending the demo marker.

Verify end to end against the live backend:

```bash
ANTHROPIC_API_KEY=sk-ant-... FINCOACH_API_URL=https://api.bsghcal.com \
  python tests/smoke_test_llm.py
```

---

## CORS

The backend reads `ALLOWED_ORIGINS` (comma-separated). `render.yaml` defaults to
`https://fincoach.bsghcal.com,https://fincoach-app.pages.dev`. If the Pages
project gets a suffixed subdomain (e.g. `fincoach-app-ab1.pages.dev`), add it in
the Render dashboard. A request blocked by CORS shows up as a failed fetch in
the browser console and the frontend falls back to demo data.

---

## Summary of the one-time manual steps (Render account required)

1. Render: New -> Blueprint -> connect repo -> apply (creates `fincoach-api`).
2. Cloudflare DNS: `CNAME api -> <render-host>` (DNS only).
3. Render: add custom domain `api.bsghcal.com`.
4. GitHub: set Variable `APP_API_BASE = https://api.bsghcal.com`.
5. Run `deploy-app.yml` (creates `fincoach-app` Pages project).
6. Cloudflare Pages: add custom domain `fincoach.bsghcal.com`.
7. Later: Render -> add `ANTHROPIC_API_KEY` secret to go fully live.
