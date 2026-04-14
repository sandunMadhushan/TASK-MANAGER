# 4 — Frontend on Vercel (example)

The frontend is a **Vite** app. Vercel (or Netlify / Cloudflare Pages) builds it and serves static files from `dist/`. **No Node server** is required for the UI in production.

## Prerequisites

- GitHub repo connected to Vercel.
- You know your **backend** public URL, e.g. `https://your-api-domain.com`.
- You chose a **production branch** (can be non-`main` — see [00-git-branch-strategy.md](./00-git-branch-strategy.md)).

## Create a Vercel project

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project**.
2. **Import** your Git repository.
3. **Root Directory**: leave **default** (repository root, where `package.json` is).
4. **Framework Preset**: Vite (auto-detected usually).
5. **Build Command**: `npm run build` (default).
6. **Output Directory**: `dist` (Vite default).
7. **Install Command**: `npm install` (default).

## Branch settings

- In project **Settings → Git**, set **Production Branch** to the branch you deploy from (e.g. `deployment` or `main`).

## Environment variables (critical)

Vite reads variables that start with `VITE_` at **build time**. Set these in Vercel → **Settings → Environment Variables** for **Production** (and Preview if you use previews).

| Variable                           | Example                                       | Purpose                         |
| ---------------------------------- | --------------------------------------------- | ------------------------------- |
| `VITE_API_URL`                     | `https://your-api-domain.com/api`             | All REST calls from the browser |
| `VITE_NOVU_APPLICATION_IDENTIFIER` | From Novu Cloud                               | Inbox / bell                    |
| `VITE_NOVU_BACKEND_URL`            | Novu’s **hosted** backend URL for your region | Novu React SDK                  |
| `VITE_NOVU_SOCKET_URL`             | Novu’s **WebSocket** URL for your region      | Realtime inbox                  |

Exact Novu values come from [06-novu-production.md](./06-novu-production.md). If you skip Novu in production, inbox features may not work until these are set.

**After changing env vars**, trigger a **new deployment** (Redeploy) so the bundle rebuilds with new `VITE_*` values.

## Deploy

1. **Deploy**. Wait for build to finish.
2. Open the **.vercel.app** URL (or your custom domain).
3. Try **sign up / login**. If requests fail, open browser **DevTools → Network** and check CORS / 404 / wrong API URL.

## SPA refresh routing (important)

For React Router pages (`/dashboard`, `/team`, `/tasks/...`), direct refresh must rewrite to `index.html`.

This repo now includes `vercel.json` with:

- source: `/(.*)`
- destination: `/index.html`

If refresh still shows `404: NOT_FOUND`, confirm:

1. `vercel.json` exists in repo root.
2. It is included in the deployed commit/branch.
3. You triggered a fresh redeploy after adding it.

## Sync with backend CORS

On your backend environment, set `CLIENT_ORIGIN` to your **exact** Vercel production URL, e.g.:

```text
https://nexus-tasks.vercel.app
```

Use **https**, no path. Then restart/redeploy your backend service so the new CORS value is active.

## Password reset links

Reset emails use `CLIENT_ORIGIN` on the server to build `https://your-frontend/reset-password?token=...`. If `CLIENT_ORIGIN` is wrong, links in email will point to the wrong host.

## Checklist

- [ ] `VITE_API_URL` ends with `/api` (matches local default pattern)
- [ ] Production deployment succeeded
- [ ] SPA rewrite is active (`vercel.json`) so page refresh does not 404
- [ ] `CLIENT_ORIGIN` on backend matches this frontend URL
- [ ] Redeploy frontend after any `VITE_*` change
