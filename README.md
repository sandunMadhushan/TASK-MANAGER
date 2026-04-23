<h1 align="center">Nexus Tasks</h1>

<p align="center">
  <img src="./public/logo.png" alt="Nexus Tasks Logo" width="120" />
</p>

<p align="center">
  A modern, workspace-based task and project management app with a premium glassmorphism UI, secure authentication, profile management, team collaboration, and Novu-powered notifications.
</p>

## Features

- Workspace-isolated multi-user system (each account/team is separated)
- Secure auth with JWT + hashed passwords (`bcryptjs`)
- Sign up, sign in, logout
- Forgot password + reset password flow (via Novu email workflow)
- Change password from Profile
- Profile management (name, email, avatar)
- Avatar upload with crop + zoom before saving
- Project management with workspace ownership rules (create, rename, move, archive/delete)
- Task CRUD with status management and assignee support
- Project-scoped task organization (keep tasks separated by project)
- Multi-project workflow support (users can work across multiple projects in the same workspace)
- Team management (invite/edit/remove members from workspace — accounts are not deleted)
- Real-time-ready Novu inbox bell and notifications page
- Global search, filters, sorting, and polished dark glass UI
- Dashboard project pulse cards with quick navigation to filtered project tasks
- Clear assignee context in task cards (assignee names + labeled assignee email display)
- Workspace-first wording updates across Team/Projects UI for clarity
- **Desktop:** Tauri v2 app sharing the same React UI (release workflow builds Windows, macOS, and Linux artifacts)

## What Changed Recently

- Added dedicated **Projects** flow so work is grouped per project inside a workspace.
- Added project filters and project-aware task views so users can focus on one project at a time.
- Enabled quick jump from Dashboard project cards to the related project tasks.
- Improved Dashboard summary and project pulse readability with clearer labels and helper text.
- Updated Team and Projects wording from "Group" to **Workspace** where relevant.
- Improved Tasks filter-bar spacing/alignment (search icon and select text positioning).
- Clarified task card footer by labeling assignee emails explicitly.

## User Flow (Quick Start)

1. Sign up (or log in) to enter your workspace.
2. Create one or more projects from the **Projects** page.
3. Create tasks and assign each task to the relevant project.
4. Use project filters on the **Tasks** page to focus on a single project.
5. Switch projects anytime to work across multiple projects in the same workspace.
6. Use the **Dashboard** project pulse cards to jump directly into project-specific tasks.

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Zustand, ShadCN UI
- Desktop: **Tauri 2** (`src-tauri/`) with `@tauri-apps/plugin-http` for reliable calls to your production API (avoids WebView mixed-content / CORS edge cases)
- Backend: Node.js, Express, MongoDB (Mongoose)
- Auth: JWT, `bcryptjs`
- Notifications: Novu (`@novu/api`, `@novu/react`)

## Project Structure

```text
.
├── server/                 # Express API (deploy to AWS EC2, PM2, etc.)
├── src-tauri/              # Tauri desktop shell + Rust
├── scripts/                # e.g. generate-tauri-icons.mjs
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── …
├── .env.example            # Local dev template
└── .env.production.example # Vite/Tauri production build (VITE_* only)
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
- `npm run tauri:build` - production Vite build + Tauri installer/bundles
- `npm run icons:generate` - convert `public/logo.png` → `src-tauri/icons/` (run when you change the logo)
- `npm run release:version -- <x.y.z> [--tag]` - sync release version across `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` (optional tag creation)

## Desktop App (Tauri)

The same React app runs inside **Tauri** (`src-tauri/`). API calls use **`@tauri-apps/plugin-http`** when running as Tauri so **HTTP** APIs (e.g. `http://` on EC2) still work from the desktop shell (WebView mixed-content rules do not apply to that path).

### One-time prerequisites (Windows)

- Install Rust toolchain via [rustup](https://rustup.rs/)
- Install Visual Studio Build Tools with **MSVC + Windows SDK**
- Ensure WebView2 runtime is installed (usually already present on Windows 10/11)

### Run desktop app (dev)

Uses local Vite + default dev API URL unless you override `VITE_API_URL` in `.env`.

```bash
npm run tauri:dev
```

### Build desktop installer (production API)

**Important:** `tauri build` runs `vite build` on **your machine** (or CI). It does **not** read the API server’s EC2 `.env`. Only **`VITE_*`** variables from your build environment are baked into the client.

1. Copy [`.env.production.example`](./.env.production.example) → **`.env.production`** (gitignored by convention; create it locally).
2. Set at least **`VITE_API_URL`** to your public API base, e.g. `https://api.yourdomain.com/api` (production builds reject `localhost` here).
3. Set **`VITE_NOVU_*`** there as well if you use the Novu inbox in the packaged app.
4. Optional: `npm run icons:generate` if you updated `public/logo.png`.
5. Build:

```bash
npm run tauri:build
```

Installers appear under `src-tauri/target/release/bundle/` (e.g. `.msi` / `.exe` on Windows). The app opens **maximized** by default (`tauri.conf.json`).

### Desktop auto-updates (GitHub Releases)

This project is wired to use the Tauri updater with GitHub Releases:

- Updater plugin: `@tauri-apps/plugin-updater` + `tauri-plugin-updater`
- Update endpoint: `https://github.com/sandunMadhushan/TASK-MANAGER/releases/latest/download/latest.json`
- Settings page includes **Check for updates**
- App also performs a silent startup check in desktop builds
- If an update exists, the app shows a themed toast with **Install now** / **Later** actions (no browser confirm popup)
- CI workflow (`.github/workflows/desktop-release.yml`) builds signed desktop artifacts on `v*` tags and publishes release assets automatically
- **Updater package policy (Windows):** release metadata now publishes separate updater targets for both **MSI** and **EXE** installs, so each installed type can receive auto-updates through its matching package.
- Updater manifest (`latest.json`) is generated after Windows/macOS/Linux uploads, and includes platform entries for signed updater-compatible artifacts (`windows-*`, `darwin-*`, `linux-*`).
- Desktop deep-link support is configured for `nexustasks://...` (used by the reset-password success flow to open the installed app from browser).

Before shipping updater-enabled releases, you must configure signing:

1. Generate a Tauri updater key pair (once).
2. Put the **private key** and password in CI/local build secrets.
3. Replace `src-tauri/tauri.conf.json` updater `pubkey` with your public key.
4. Push a release tag (`v*`) so GitHub Actions runs `.github/workflows/desktop-release.yml`.
5. Let CI build signed updater artifacts and attach them to the GitHub Release.

Without a valid updater key pair + published updater artifacts, update checks will fail at runtime.

### Version bump shortcut

To keep release versions aligned across `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`:

```bash
npm run release:version -- 0.1.2
```

Optional: create an annotated tag in the same step:

```bash
npm run release:version -- 0.1.2 --tag
```

For release checklist in this branch, follow the version bump -> tag push -> GitHub Actions build -> updater test flow described in the Desktop App section above.

## Environment Variables

**Two places:** (1) **Server** (EC2 `.env` / PM2) — secrets and DB. (2) **Frontend / Tauri build** — **`.env.production`** with **`VITE_*`** only (inlined at `vite build` time).

### Core (backend — AWS / local API)

- `PORT` - backend port (default `4000`)
- `MONGODB_URI` - MongoDB connection URI
- **`CLIENT_ORIGIN`** - One or more **exact frontend origins** for CORS and for links in emails (welcome, password reset). Use a **comma-separated** list, no path:  
  `https://app.yourdomain.com,https://your-app.vercel.app`  
  **First** origin is used as the base for those email links. Trailing slashes are normalized. Server enables **`credentials: true`** with CORS.
- **`VITE_API_URL`** - Used by **Vite/Tauri builds** only (not by Node on EC2). Point it at your public API, e.g. `https://api.yourdomain.com/api`.

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
- `NOVU_WORKFLOW_*` - workflow identifiers (use **underscores** in env names on Linux, e.g. `NOVU_WORKFLOW_TEAM_INVITE_DECLINED`, not hyphens)
- `NOVU_WORKFLOW_TASK_ASSIGNED` - task-assigned notifications
- `NOVU_WORKFLOW_TASK_COMPLETED` - task-completed notifications
- `NOVU_WORKFLOW_DEADLINE_NEAR` - deadline reminders
- `NOVU_WORKFLOW_PASSWORD_RESET` - forgot-password emails

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
6. After successful reset, web triggers `nexustasks://open?source=reset-password` to open installed desktop app and then falls back to `/login`

Notes:

- Password reset does **not** auto-login on web or desktop; user signs in manually with the new password.

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

Default local base URL: `http://localhost:4000/api`. In production, use your deployed API (same value as **`VITE_API_URL`** without trailing slash issues).

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

### Projects

- `GET /projects`
- `POST /projects`
- `PATCH /projects/:projectId`
- `DELETE /projects/:projectId`

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
- Projects are workspace-scoped; project operations are validated against workspace membership/ownership rules
- Assignment validation is workspace-bound

## Deployment (AWS + Vercel + Novu + desktop)

Recommended production split:

- **Backend API** on **AWS EC2** — Node runs `npm run server:start` (often behind **Nginx** + TLS), managed with **PM2** or systemd. All **`MONGODB_URI`**, **`AUTH_JWT_SECRET`**, **`CLIENT_ORIGIN`**, **`NOVU_API_KEY`**, etc. live **only** on the server.
- **Frontend** — **Vercel** or any static host / custom domain (e.g. `https://taskmanager.example.com`). Build = `npm run build` with **`VITE_*`** set in the host’s env or in **`.env.production`** locally before upload.
- **Database** — MongoDB Atlas (or self-hosted)
- **Notifications** — Novu cloud or self-hosted
- **Desktop** — Built on a developer machine or CI with **`.env.production`**; installers do not bundle server secrets.

### AWS API checklist (CORS)

If the browser or a hosted SPA shows **“Failed to fetch”** for login/signup but **`GET /api/health`** works, the frontend **Origin** is usually missing from **`CLIENT_ORIGIN`**. After changing it on EC2:

```bash
pm2 restart <your-api-process>
```

### Production checklist

- **EC2:** `MONGODB_URI`, **`CLIENT_ORIGIN`** (all SPA origins that call the API, comma-separated), `AUTH_*`, `NOVU_*`; restart PM2 after edits
- **SPA host (Vercel / static):** `VITE_API_URL`, `VITE_NOVU_*`; redeploy after any `VITE_*` change
- **Tauri release (recommended):** push `v*` tag and let GitHub Actions build and attach updater assets/signatures automatically
- `vercel.json` SPA rewrite active where applicable (prevents refresh 404 on routes)
- Novu workflows created and published with identifiers matching **`NOVU_WORKFLOW_*`** (underscore names on server)

## Production Notes

- Use a strong, private `AUTH_JWT_SECRET`
- Use production-grade MongoDB and backups
- Configure real email sending provider in Novu
- Use **HTTPS** for the public API in production when possible; the desktop app can still call **HTTP** APIs via the Tauri HTTP plugin, but browsers require HTTPS for secure contexts
- Keep **`CLIENT_ORIGIN`** in sync with every frontend origin (custom domain + Vercel preview/production if both are used)
- Consider rate-limiting auth endpoints before public launch

## Contributing

Contributions are welcome.

If you want to contribute, please use the fork workflow:

1. Fork this repository on GitHub.
2. Clone your fork locally and create a feature branch.
3. Make your changes and test locally.
4. Commit and push your branch to your fork.
5. Open a Pull Request from your fork to this repository.

## License

This project is licensed under the **Apache License 2.0**. See `LICENSE` for details.
