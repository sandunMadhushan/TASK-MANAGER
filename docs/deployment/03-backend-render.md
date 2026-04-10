# 3 — Backend on Render (example)

Render is one straightforward way to run **Express** on a free tier. Alternatives (Railway, Fly.io) follow the same idea: **install** dependencies, **start** `server/index.js`, set **environment variables**.

## Prerequisites

- GitHub repo pushed (any branch you chose for production — see [00-git-branch-strategy.md](./00-git-branch-strategy.md)).
- `MONGODB_URI` from Atlas ([02-mongodb-atlas.md](./02-mongodb-atlas.md)).
- A long random string for `AUTH_JWT_SECRET` (generate in a password manager or `openssl rand -hex 32` locally — you only paste the **value** into Render, not into your `.env` file if you do not want to).

## Create a Web Service

1. [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**.
2. **Connect** your GitHub repository.
3. **Branch**: select the branch you use for production (e.g. `main` or `deployment`).
4. **Root directory**: leave **empty** (repository root — where `package.json` lives).
5. **Runtime**: **Node**.
6. **Build Command**: `npm install`
7. **Start Command**: `npm run server:start`  
   (This runs `node server/index.js` per `package.json`.)

## Instance type

- Choose **Free** if available (may spin down after idle).

## Health check (optional but useful)

- **Health check path**: `/api/health`  
  Your app exposes `GET /api/health` returning `{ "status": "ok" }`.

Render injects **`PORT`** automatically; your server already uses `process.env.PORT`.

## Environment variables (Render → Environment)

Set at least the **required** variables from [05-environment-variables-reference.md](./05-environment-variables-reference.md).

**Minimum to boot:**

| Key | Example / note |
|-----|----------------|
| `MONGODB_URI` | Atlas SRV string |
| `AUTH_JWT_SECRET` | Long random secret (production-only value) |
| `NODE_ENV` | `production` |

**After you know your frontend URL** (next guide):

| Key | Value |
|-----|--------|
| `CLIENT_ORIGIN` | `https://your-app.vercel.app` (no trailing slash required; code normalizes) |

**Important:** `CLIENT_ORIGIN` is used for:

- **CORS** (browser allowed to call your API)
- **Password reset links** in emails (`.../reset-password?token=...`)

So it must be the **public URL of your deployed frontend**, not `localhost`.

## First deploy

1. Click **Create Web Service**.
2. Wait for build + deploy logs.
3. Note your service URL, e.g. `https://nexus-tasks-api.onrender.com`.
4. Test in browser: `https://YOUR-SERVICE.onrender.com/api/health` → should return JSON `status: ok`.

## API base for the frontend

Your frontend expects `VITE_API_URL` to include the `/api` prefix (see `task-api.ts` default `http://localhost:4000/api`).

So on Vercel you will set:

```text
VITE_API_URL=https://YOUR-SERVICE.onrender.com/api
```

(Replace with your real Render hostname.)

## Free tier note

The first request after idle may be **slow** while the instance wakes. That is normal on free Render.

## Checklist

- [ ] Web service created from correct **branch**  
- [ ] `MONGODB_URI` + `AUTH_JWT_SECRET` set  
- [ ] `CLIENT_ORIGIN` set to **production frontend** URL once Vercel exists  
- [ ] `/api/health` works in browser  
