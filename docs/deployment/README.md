# Deploy Nexus Tasks (step-by-step guides)

These guides explain how to run the **same app** on the public internet using **free-tier-friendly** services, **without changing your local project files** for day-to-day work.

## What stays local and untouched

- Your **`.env`** file on your machine can stay exactly as it is for **localhost**.
- You do **not** need to paste production URLs or secrets into `.env` to keep coding locally.
- Production **keys and URLs** are set only in each host’s **Environment variables** (dashboard).

## How to use these docs

Read in order:

| Order | File | Topic |
|------|------|--------|
| 0 | [`00-git-branch-strategy.md`](./00-git-branch-strategy.md) | **Using a branch only (no merge to main)** — does it work? |
| 1 | [`01-overview-and-accounts.md`](./01-overview-and-accounts.md) | Big picture, what you will create |
| 2 | [`02-mongodb-atlas.md`](./02-mongodb-atlas.md) | Free database |
| 3 | [`03-backend-render.md`](./03-backend-render.md) | Express API on Render (example) |
| 4 | [`04-frontend-vercel.md`](./04-frontend-vercel.md) | Vite build on Vercel (example) |
| 5 | [`05-environment-variables-reference.md`](./05-environment-variables-reference.md) | Full env checklist for dashboards |
| 6 | [`06-novu-production.md`](./06-novu-production.md) | Notifications in the cloud |
| 7 | [`07-troubleshooting.md`](./07-troubleshooting.md) | Common failures |
| 8 | [`08-master-to-deployment-workflow.md`](./08-master-to-deployment-workflow.md) | **Daily Git flow:** push docs to `deployment`, then keep it updated from `master` |

You can swap **Render ↔ Railway ↔ Fly.io** or **Vercel ↔ Netlify ↔ Cloudflare Pages** if you prefer; the **concepts** (env vars, CORS, build-time `VITE_*`) stay the same.

## After deployment

- **Local:** still `npm run server:dev` + `npm run dev` with your existing `.env`.
- **Production:** separate URLs; configure CORS and `VITE_*` only on the hosts, not in your laptop `.env`.
