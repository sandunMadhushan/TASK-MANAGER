# 6 — Novu in production

The app uses Novu for notifications and (optionally) password-reset email. Local `.env` may point at **local Novu** or placeholders; production needs **Novu Cloud** (or your hosted Novu) values in **backend env + Vercel** only.

## 1. Novu Cloud project

1. Sign in at [Novu](https://novu.co) (or your self-hosted dashboard if you use that).
2. Create or select an **application**.
3. Note:
   - **Application identifier** (used as `VITE_NOVU_APPLICATION_IDENTIFIER` and referenced on server where applicable).
   - **API key** for server triggers → `NOVU_API_KEY` on backend env.
   - **Backend / API URL** and **WebSocket URL** for the React SDK → `VITE_NOVU_BACKEND_URL`, `VITE_NOVU_SOCKET_URL` on Vercel (and server env if your code expects `NOVU_BACKEND_URL`).

> Novu’s exact labels in the dashboard change over time; match the concepts: **secret key** (server), **app id** (client), **API base URL**, **socket URL**.

## 2. Workflows

Create and **publish** workflows whose IDs match your env:

- `NOVU_WORKFLOW_TASK_ASSIGNED`
- `NOVU_WORKFLOW_TASK_COMPLETED`
- `NOVU_WORKFLOW_DEADLINE_NEAR`
- `NOVU_WORKFLOW_PASSWORD_RESET`

Defaults in `.env.example` are names like `task-assigned`, `password-reset`, etc. Your Novu workflow **identifier** must match what you set in backend env.

## 3. Email provider

For password reset and email channels:

1. Connect an email provider in Novu (SendGrid, SES, Resend, etc.).
2. Complete Novu’s verification steps so mail can leave **production** (sandbox vs live depends on provider).

## 4. Where to set variables

| Variable | Host |
|----------|------|
| `NOVU_API_KEY`, `NOVU_BACKEND_URL`, workflow IDs, `VITE_NOVU_APPLICATION_IDENTIFIER` (if server reads it) | **Backend env** (EC2 app) |
| `VITE_NOVU_APPLICATION_IDENTIFIER`, `VITE_NOVU_BACKEND_URL`, `VITE_NOVU_SOCKET_URL` | **Vercel** (frontend build) |

After changing **Vercel** Novu vars, **redeploy** the frontend.

## 5. Subscriber / inbox auth

Your backend exposes routes that help the inbox authenticate (subscriber hash, etc.). If the inbox shows **401**, compare:

- App identifier
- Backend URL
- Secrets on backend host vs Novu dashboard

See project `README.md` and server `novu-auth-service.js` behavior when debugging.

## Checklist

- [ ] Workflows exist and are **published**  
- [ ] Workflow IDs match backend env
- [ ] Email provider sends to real inboxes (not only sandbox)  
- [ ] All `VITE_NOVU_*` use **https/wss** production URLs on Vercel  
