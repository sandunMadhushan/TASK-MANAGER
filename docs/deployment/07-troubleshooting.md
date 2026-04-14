# 7 — Troubleshooting

## CORS errors in the browser

**Symptom:** Console shows blocked by CORS; API works in Postman.

**Fix:**

- Set `CLIENT_ORIGIN` on the **backend** to the **exact** frontend origin: `https://your-app.vercel.app` (scheme + host, no trailing path).
- No wildcards in this app’s current `cors({ origin: env.clientOrigin })` — one origin string.
- Redeploy backend after changing env.

## API returns 401 for everything from the site

**Symptom:** Login or tasks fail with unauthorized.

**Checks:**

- `VITE_API_URL` on Vercel must point to the **same** API you configured (correct `/api` suffix).
- Token storage: clear site data and log in again.
- Server `AUTH_JWT_SECRET` must be set; changing it **invalidates** all old tokens.

## `VITE_API_URL` wrong after deploy

**Symptom:** Requests go to localhost or old URL.

**Cause:** Vite bakes `VITE_*` at **build** time.

**Fix:** Change variable in Vercel → **Redeploy** frontend.

## Backend: server crashes on start

**Symptom:** Logs say missing `MONGODB_URI` or `AUTH_JWT_SECRET`.

**Fix:** Add both in backend production env; restart backend process.

## MongoDB connection failed

**Symptom:** Mongoose errors in backend logs.

**Checks:**

- Atlas **Network Access** allows your backend outbound traffic (`0.0.0.0/0` is common to start).
- User/password correct in URI; special characters URL-encoded.
- Cluster is not paused (Atlas free tier can pause after inactivity — resume in dashboard).

## Free tier: API unreachable or timeout

**Symptom:** 30–60s wait, then app works.

**Cause:** On EC2, this is usually security group / Nginx / PM2 misconfiguration (not auto-sleep).

**Mitigation:** Verify EC2 inbound ports (`80/443`), PM2 process status, and Nginx proxy target `127.0.0.1:4000`.

## Avatar / file uploads disappear after redeploy

**Symptom:** Images worked, then vanished after new deploy.

**Cause:** Many PaaS **filesystems are ephemeral**; uploaded files are not kept on disk long-term.

**Long-term fix:** Store avatars in **object storage** (S3, R2, Cloudinary). That requires a **code change** later — not covered by “zero code change” deploy; this doc only warns you.

## Novu: no email or inbox empty

**Checks:**

- Workflow **published**
- Workflow ID matches backend env
- Provider not stuck in sandbox
- `NOVU_API_KEY` correct for **cloud** project
- Frontend `VITE_NOVU_*` use production URLs and were set **before** last successful build

## Password reset link goes to localhost

**Cause:** `CLIENT_ORIGIN` on backend still `http://localhost:5173`.

**Fix:** Set to production frontend URL; trigger new reset email.

## Branch deploy shows old code

**Cause:** Production branch not updated from `main`.

**Fix:** `git checkout your-deploy-branch && git merge main && git push`
