# 5 — Environment variables reference (dashboards only)

This table maps **`.env.example`** names to **where** you set them in production.  
You do **not** need to change your local `.env` if you set these only on your backend host (AWS EC2 in this guide) and **Vercel**.

## Backend (e.g. AWS EC2)

| Variable | Required | Notes |
|----------|----------|--------|
| `PORT` | Recommended | Use a fixed internal app port like `4000` behind Nginx. |
| `NODE_ENV` | Recommended | `production` |
| `MONGODB_URI` | **Yes** | Atlas connection string |
| `CLIENT_ORIGIN` | **Yes** | Public **frontend** URL (`https://....vercel.app`). Used for CORS + password reset links. |
| `AUTH_JWT_SECRET` | **Yes** | Strong random string; **different** from localhost is fine |
| `AUTH_JWT_EXPIRES_IN` | Optional | Default `7d` if omitted in code path — confirm `server/config/env.js` |
| `AUTH_DEFAULT_PASSWORD` | Optional | Default users seed; change in prod if you use `ensureDefaultUsers` |
| `AUTH_PASSWORD_RESET_TOKEN_MINUTES` | Optional | Default `30` |
| `NOVU_API_KEY` | For Novu | Server-side secret |
| `NOVU_BACKEND_URL` | For Novu | Novu API base URL (cloud) |
| `NOVU_WORKFLOW_TASK_ASSIGNED` | For Novu | Workflow identifier |
| `NOVU_WORKFLOW_TASK_COMPLETED` | For Novu | |
| `NOVU_WORKFLOW_DEADLINE_NEAR` | For Novu | |
| `NOVU_WORKFLOW_PASSWORD_RESET` | For Novu | |
| `VITE_NOVU_APPLICATION_IDENTIFIER` | For Novu subscriber JWT | Also used in `server/config/env.js` — backend reads this name for Novu app id |

Check `server/config/env.js` if you add new env vars in the future.

## Frontend (e.g. Vercel) — build time

| Variable | Required | Notes |
|----------|----------|--------|
| `VITE_API_URL` | **Yes** | `https://YOUR-API-HOST/api` |
| `VITE_NOVU_APPLICATION_IDENTIFIER` | For inbox | Public app identifier from Novu |
| `VITE_NOVU_BACKEND_URL` | For inbox | Novu hosted backend |
| `VITE_NOVU_SOCKET_URL` | For inbox | `wss://...` in production (not `ws://localhost`) |

## Local vs production (mental model)

| Location | Purpose |
|----------|---------|
| Laptop `.env` | `localhost` URLs + your dev secrets — **unchanged** if you prefer |
| Backend host env (`server/.env.production` on EC2) | Production API + DB + server Novu + `CLIENT_ORIGIN` |
| Vercel env | Production `VITE_*` baked into static JS |

Same variable **names**, **different values** per environment. No merge conflict on your machine.

## Copy-paste workflow

1. Open `.env.example` as a **checklist** only (do not paste secrets into git).
2. For each line, create the key in the correct dashboard and paste the **production** value there.
3. Keep using your real `.env` locally for `npm run dev`.
