<h1 align="center">Nexus Tasks</h1>

<p align="center">
  <img src="./public/logo.png" alt="Nexus Tasks Logo" width="120" />
</p>

<p align="center">
  A modern, workspace-based task management app with a premium glassmorphism UI, secure authentication, profile management, team collaboration, and Novu-powered notifications.
</p>

## Features

- Workspace-isolated multi-user system (each account/team is separated)
- Secure auth with JWT + hashed passwords (`bcryptjs`)
- Sign up, sign in, logout
- Forgot password + reset password flow (via Novu email workflow)
- Change password from Profile
- Profile management (name, email, avatar)
- Avatar upload with crop + zoom before saving
- Task CRUD with status management and assignee support
- Team management (invite/edit/remove members from workspace — accounts are not deleted)
- Real-time-ready Novu inbox bell and notifications page
- Global search, filters, sorting, and polished dark glass UI

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Zustand, ShadCN UI
- Backend: Node.js, Express, MongoDB (Mongoose)
- Auth: JWT, `bcryptjs`
- Notifications: Novu (`@novu/api`, `@novu/react`)

## Project Structure

```text
.
├── server/
│   ├── app.js
│   ├── index.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── services/
└── src/
    ├── components/
    │   ├── layout/
    │   ├── notifications/
    │   ├── tasks/
    │   └── ui/
    ├── layouts/
    ├── pages/
    ├── services/
    ├── store/
    ├── types/
    ├── App.tsx
    └── main.tsx
```

## Getting Started

### 1) Prerequisites

- Node.js 20+
- npm
- MongoDB running locally or remote

### 2) Install

```bash
npm install
```

### 3) Configure environment

Create `.env` from `.env.example` and fill values.

### 4) Run backend

```bash
npm run server:dev
```

### 5) Run frontend

```bash
npm run dev
```

Frontend default: `http://localhost:5173`  
Backend default: `http://localhost:4000`

## Scripts

- `npm run dev` - start frontend dev server
- `npm run build` - type-check and production build
- `npm run preview` - preview built frontend
- `npm run lint` - lint project
- `npm run server:dev` - start backend with watch mode
- `npm run server:start` - start backend normally
- `npm run tauri:dev` - run desktop app in development
- `npm run tauri:build` - build desktop installer/bundles

## Desktop App (Tauri)

Tauri scaffolding is included in `src-tauri/` so this project can run as a desktop app.

### One-time prerequisites (Windows)

- Install Rust toolchain via [rustup](https://rustup.rs/)
- Install Visual Studio Build Tools with **MSVC + Windows SDK**
- Ensure WebView2 runtime is installed (usually already present on Windows 10/11)

### Run desktop app

```bash
npm run tauri:dev
```

### Build desktop installer

```bash
npm run tauri:build
```

## Environment Variables

### Core

- `PORT` - backend port (default `4000`)
- `MONGODB_URI` - MongoDB connection URI
- `CLIENT_ORIGIN` - frontend URL for CORS
- `VITE_API_URL` - frontend API base URL

### Auth

- `AUTH_JWT_SECRET` - JWT signing secret (required)
- `AUTH_JWT_EXPIRES_IN` - access token expiry (e.g. `7d`)
- `AUTH_DEFAULT_PASSWORD` - fallback password for seeded/invited users
- `AUTH_PASSWORD_RESET_TOKEN_MINUTES` - reset token validity (default `30`)

### Novu

- `NOVU_API_KEY` - Novu API key
- `NOVU_BACKEND_URL` - Novu backend URL (self-hosted or cloud)
- `VITE_NOVU_APPLICATION_IDENTIFIER` - Novu app identifier
- `VITE_NOVU_BACKEND_URL` - Novu inbox backend URL for frontend
- `VITE_NOVU_SOCKET_URL` - Novu socket URL for frontend
- `NOVU_WORKFLOW_TASK_ASSIGNED` - workflow id for task-assigned notifications
- `NOVU_WORKFLOW_TASK_COMPLETED` - workflow id for task-completed notifications
- `NOVU_WORKFLOW_DEADLINE_NEAR` - workflow id for deadline reminders
- `NOVU_WORKFLOW_PASSWORD_RESET` - workflow id for forgot-password emails

## Authentication Flows

### Sign Up

- Creates a new user and workspace
- Requires: name, email, strong password

### Sign In

- Requires email + password
- Returns JWT and current user profile

### Forgot Password

1. User clicks `Forgot password?` on sign-in
2. Backend generates reset token and expiry
3. Novu sends reset email with reset URL
4. User opens `/reset-password?token=...`
5. User sets new password

## Novu Setup (Important)

For password reset emails to work:

1. Create a workflow in Novu with id matching `NOVU_WORKFLOW_PASSWORD_RESET`
2. Add an **Email** step
3. Use payload fields:
   - `{{payload.name}}`
   - `{{payload.resetUrl}}`
   - `{{payload.expiresInMinutes}}`
4. Publish workflow changes
5. Ensure email integration is active in the same Novu environment

## API Overview

Base URL: `http://localhost:4000/api`

### Auth

- `POST /auth/login`
- `POST /auth/signup`
- `GET /auth/me`
- `POST /auth/change-password`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Tasks

- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/:taskId`
- `PATCH /tasks/:taskId/status`
- `DELETE /tasks/:taskId`

### Users

- `GET /users`
- `POST /users`
- `PATCH /users/:userId`
- `DELETE /users/:userId` — removes member from your workspace only (account remains; they get a solo workspace)
- `GET /users/:userId/novu-auth`

### Notifications

- `GET /notifications/unread-count/:subscriberId`
- `GET /notifications/feed/:subscriberId`
- `POST /notifications/mark-all-read/:subscriberId`
- `POST /notifications/deadline-reminders`

## Workspace Isolation Rules

- Users only see users in their own workspace
- Users only see tasks relevant to them (created by or assigned to them) within workspace
- Assignment validation is workspace-bound

## Hosting (internet deploy)

Step-by-step deployment guides — including **using a separate Git branch** and keeping **local `.env` unchanged** for localhost — are in [`docs/deployment/`](./docs/deployment/README.md). For updating production after you commit to `master`/`main`, see [`docs/deployment/08-master-to-deployment-workflow.md`](./docs/deployment/08-master-to-deployment-workflow.md).

## Deployment (AWS + Vercel + Novu)

Recommended production split:

- **Backend API** on AWS (EC2) running `npm run server:start` with PM2/systemd
- **Frontend** on Vercel (build output from Vite `dist/`)
- **Database** on MongoDB Atlas
- **Notifications + email workflows** on Novu

### Deployment docs map

- Overview/accounts: [`docs/deployment/01-overview-and-accounts.md`](./docs/deployment/01-overview-and-accounts.md)
- MongoDB Atlas: [`docs/deployment/02-mongodb-atlas.md`](./docs/deployment/02-mongodb-atlas.md)
- Backend host setup: [`docs/deployment/03-backend-aws.md`](./docs/deployment/03-backend-aws.md)
- Frontend (Vercel): [`docs/deployment/04-frontend-vercel.md`](./docs/deployment/04-frontend-vercel.md)
- Env vars reference: [`docs/deployment/05-environment-variables-reference.md`](./docs/deployment/05-environment-variables-reference.md)
- Novu production setup: [`docs/deployment/06-novu-production.md`](./docs/deployment/06-novu-production.md)
- Troubleshooting: [`docs/deployment/07-troubleshooting.md`](./docs/deployment/07-troubleshooting.md)
- Update deployment branch from master/main: [`docs/deployment/08-master-to-deployment-workflow.md`](./docs/deployment/08-master-to-deployment-workflow.md)
- Novu workflow content (subject/body/redirect): [`docs/deployment/09-novu-workflow-content.md`](./docs/deployment/09-novu-workflow-content.md)

### Production checklist

- Backend env configured (`MONGODB_URI`, `CLIENT_ORIGIN`, `AUTH_*`, `NOVU_*`)
- Frontend Vercel env configured (`VITE_API_URL`, `VITE_NOVU_*`)
- `vercel.json` SPA rewrite active (prevents refresh 404 on routes)
- Novu workflows created and published with matching identifiers
- Backend restarted after env changes
- Frontend redeployed after `VITE_*` changes

## Production Notes

- Use a strong, private `AUTH_JWT_SECRET`
- Use production-grade MongoDB and backups
- Configure real email sending provider in Novu
- Set proper `CLIENT_ORIGIN` and HTTPS
- Consider rate-limiting auth endpoints before public launch

## License

Private project. All rights reserved.
