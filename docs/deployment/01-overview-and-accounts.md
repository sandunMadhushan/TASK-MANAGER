# 1 — Overview and accounts

## What you are deploying

This project is **two runnable parts** plus **external services**:

1. **Frontend** — React + Vite. Built to static files (`npm run build` → `dist/`).
2. **Backend** — Node + Express (`server/`). Must run **continuously** (or wake on request on free tiers).
3. **MongoDB** — Database (local in dev; **Atlas** in production).
4. **Novu** (optional but used in app) — Cloud workflows + inbox; needs correct cloud URLs and keys in dashboards.

Nothing in this guide requires you to **edit** your laptop’s `.env`. You will create **new** values only in:

- MongoDB Atlas UI  
- AWS EC2 environment file / secret management (or similar host env)  
- Vercel (or similar) **Environment Variables**  
- Novu Cloud dashboard  

## Suggested free-tier combination (examples)

| Layer | Example service | Why |
|-------|-----------------|-----|
| DB | MongoDB Atlas M0 | Free cluster, works with Mongoose as-is |
| API | AWS EC2 (t2.micro/t3.micro) | Free-tier eligible, full server control |
| UI | Vercel | Free for hobby; good Vite support |
| Notifications | Novu Cloud | Matches `@novu/api` + `@novu/react` |

You may substitute other hosts; env var **names** stay the same as in [05-environment-variables-reference.md](./05-environment-variables-reference.md).

## Accounts to create (once)

1. [GitHub](https://github.com) — repository for your code (if not already).
2. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — cluster + database user + connection string.
3. [AWS](https://aws.amazon.com/free/) — launch EC2 and deploy backend.
4. [Vercel](https://vercel.com) — connect GitHub, deploy frontend.
5. [Novu](https://novu.co) — if you use notifications and password-reset email in production.

## Order of operations

1. Atlas → you get `MONGODB_URI`.
2. Deploy **backend** first → you get `https://your-api-domain.com` (example).
3. Deploy **frontend** with `VITE_API_URL` pointing at that API **base** (see [04-frontend-vercel.md](./04-frontend-vercel.md)).
4. Update backend **`CLIENT_ORIGIN`** to your **frontend** URL (CORS).
5. Configure **Novu** and copy production identifiers into backend environment + Vercel env (see [06-novu-production.md](./06-novu-production.md)).

## Local development after all of this

Unchanged:

```bash
npm run server:dev
npm run dev
```

Your existing `.env` still targets `localhost`. Production is a **parallel** configuration on the internet.
