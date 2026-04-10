# Nexus Tasks

A modern, workspace-based task management app with a premium glassmorphism UI, secure authentication, profile management, team collaboration, and Novu-powered notifications.

## Features

- Workspace-isolated multi-user system (each account/team is separated)
- Secure auth with JWT + hashed passwords (`bcryptjs`)
- Sign up, sign in, logout
- Forgot password + reset password flow (via Novu email workflow)
- Change password from Profile
- Profile management (name, email, avatar)
- Avatar upload with crop + zoom before saving
- Task CRUD with status management and assignee support
- Team management (invite/edit/delete users)
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
- `DELETE /users/:userId`
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

## Production Notes

- Use a strong, private `AUTH_JWT_SECRET`
- Use production-grade MongoDB and backups
- Configure real email sending provider in Novu
- Set proper `CLIENT_ORIGIN` and HTTPS
- Consider rate-limiting auth endpoints before public launch

## License

Private project. All rights reserved.

