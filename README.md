# Task Manager

A modern task management web application with a premium glassmorphism UI, clean architecture, and a phased delivery plan. The product targets **user authentication**, **task CRUD**, **assignments**, **status workflows**, and **Novu-powered notifications** once all milestones are complete.

---

## Table of contents

- [Vision & scope](#vision--scope)
- [Current status](#current-status)
- [Roadmap](#roadmap)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [UI & design guidelines](#ui--design-guidelines)
- [Future configuration](#future-configuration)
- [Maintaining this README](#maintaining-this-readme)

---

## Vision & scope

| Area | Direction |
|------|-----------|
| **Experience** | Dark, glass-style surfaces; soft gradients; Framer Motion for meaningful motion; responsive layouts. |
| **Frontend** | React (Vite), TypeScript, Tailwind CSS v4, ShadCN UI, Zustand for client state. |
| **Backend** | Node.js, Express, MongoDB (Mongoose)—to be added per roadmap. |
| **Notifications** | Novu (self-hosted), triggered from the backend for assignment, completion, and deadline events. |

Non-goals for early steps: shipping production auth or APIs before their dedicated milestone (see [Roadmap](#roadmap)).

---

## Current status

> **Update this block after each milestone** so newcomers and future you see the truth at a glance.

| Milestone | Status | Notes |
|-----------|--------|--------|
| Step 1 — Frontend setup & UI foundation | **Done** | Vite + React + TS, Tailwind v4, ShadCN, Framer Motion, glass dashboard shell, dummy task cards. No backend or auth. |
| Step 2 — Task UI (frontend only) | **Done** | `TaskCard`, `TaskListView`, `CreateTaskModal`; Zustand task store; add/remove/status animations; title validation. No API. |
| Step 3 — Backend setup | **Done** | Express API in `server/`, MongoDB config, Mongoose `TaskModel`, create/list/update-status/delete routes. |
| Step 4 — Connect frontend ↔ API | **Done** | Frontend now uses backend APIs for list/create/edit/status update/delete with loading + error states. |
| Step 5 — Users & assignment | **Done** | Added `User` model + `/api/users`; task assignment validates user IDs; UI select + assignee display. |
| Step 6 — Novu integration | **Done** | Novu SDK integrated with assignment, completion, and deadline-reminder triggers. |
| Step 7 — UI polish | Not started | Micro-interactions, skeletons, empty states, responsiveness. |

**Last README update:** 2026-04-09 (Steps 1-6 complete).

---

## Roadmap

Use this as the single checklist for planning and for updating the [Current status](#current-status) table.

### Step 1 — Frontend setup + UI foundation *(complete)*

- [x] Vite + React + TypeScript
- [x] Tailwind CSS v4 (`@tailwindcss/vite`)
- [x] ShadCN UI (components + theme)
- [x] Framer Motion
- [x] Zustand installed; task store added in Step 2
- [x] Base layout: glass sidebar, top navbar, dashboard, dummy cards
- [x] No backend, no auth, no business logic

### Step 2 — Task UI (frontend only) *(complete)*

- [x] `TaskCard` component (title, description, status, due date, tag; status select + delete)
- [x] `TaskListView` grid + empty state
- [x] Create Task modal (ShadCN Dialog + fields; title validation; glass styling)
- [x] Framer Motion: list enter/exit (`AnimatePresence`), modal inner motion, card hover
- [x] Zustand `useTaskStore` for seeded + user tasks—still **no** HTTP calls

### Step 3 — Backend setup *(complete)*

- [x] Express app + `server/config`, `server/controllers`, `server/models`, `server/routes`, `server/services`
- [x] MongoDB connection through Mongoose (`server/config/db.js`)
- [x] **Task** schema with `title`, `description`, `status`, `assignedTo`, `dueDate`, `createdAt`
- [x] APIs: `POST /api/tasks`, `GET /api/tasks`, `PATCH /api/tasks/:taskId/status`, `DELETE /api/tasks/:taskId`

### Step 4 — Connect frontend + backend

- [x] API client in `src/services/` (`task-api.ts`)
- [x] Replaced dummy/local seed list with real requests
- [x] Added loading and error states (`TaskListView`, create/edit modals, status updates)

### Step 5 — Users + assignment

- [x] **User** model and minimal user APIs with default user seeding
- [x] Assign task to user; persist `assignedTo`
- [x] Show assignee on task cards and create-task form

### Step 6 — Novu integration *(complete)*

- [x] Novu SDK on server (`@novu/api`) + self-hosted base URL support
- [x] Subscribers use `subscriberId=user.id` and `email=user.email`
- [x] Triggers: task assigned, task completed, deadline approaching

### Step 7 — Polish

- [ ] Micro-interactions and motion refinement
- [ ] Empty states and loading skeletons
- [ ] Responsive pass and accessibility checks

---

## Tech stack

### Frontend (current)

| Layer | Choice |
|-------|--------|
| Build | Vite 8 |
| UI library | React 19 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4, `tw-animate-css` |
| Components | ShadCN UI (Base UI primitives + `components.json`) |
| Motion | Framer Motion |
| State | Zustand (`useTaskStore` for tasks in Step 2+) |
| Icons | Lucide React |

### Backend & services *(planned)*

| Layer | Choice |
|-------|--------|
| Runtime | Node.js |
| HTTP | Express |
| Database | MongoDB + Mongoose |
| Notifications | Novu (self-hosted) |

---

## Repository structure

High-level layout. Backend folders appear once Step 3 is implemented (either under `server/` or repo root—**document the final choice here when added**).

```text
.
├── README.md                 # This file — keep status tables in sync with reality
├── components.json           # ShadCN configuration
├── index.html
├── package.json
├── vite.config.ts            # Vite + Tailwind plugin + @ alias
├── tsconfig*.json
├── eslint.config.js
├── public/
├── server/
│   ├── app.js
│   ├── index.js
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   └── task-controller.js
│   ├── models/
│   │   └── task-model.js
│   ├── routes/
│   │   └── task-routes.js
│   └── services/
│       └── task-service.js
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css             # Global styles + design tokens
    ├── components/
    │   ├── layout/           # AppSidebar, TopNav
    │   ├── tasks/            # TaskCard, TaskListView, CreateTaskModal
    │   └── ui/               # ShadCN primitives
    ├── hooks/                # Shared hooks (expand per feature)
    ├── layouts/              # Route/shell layouts
    ├── lib/                  # utils (e.g. cn), format-due-date
    ├── pages/                # Page-level views
    ├── services/             # API & external clients (Step 4+)
    ├── store/
    │   ├── index.ts          # re-exports
    │   └── task-store.ts     # tasks state (Step 2+)
    └── types/
        └── task.ts           # Task, TaskStatus
```

**Suggested backend layout (when created):**

```text
server/   # or ./ at repo root — pick one convention
├── config/
├── controllers/
├── models/
├── routes/
└── services/
```

---

## Getting started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (ships with Node)

You also need **MongoDB** running locally (or a reachable hosted URI) for backend APIs.

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

### Backend development

1) Copy env template and adjust values:

```bash
cp .env.example .env
```

2) Start API server:

```bash
npm run server:dev
```

Default API URL: `http://localhost:4000`

### Production build

```bash
npm run build
npm run preview   # optional local preview of dist/
```

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run server:dev` | Start Express API server with Node watch mode |
| `npm run server:start` | Start Express API server |
| `npm run build` | Typecheck (`tsc -b`) + production bundle |
| `npm run preview` | Serve the `dist/` output locally |
| `npm run lint` | ESLint across the project |

---

## Backend API (Step 3-6)

Base URL: `http://localhost:4000/api`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Health check |
| `GET` | `/tasks` | List tasks |
| `POST` | `/tasks` | Create a task |
| `PATCH` | `/tasks/:taskId` | Edit task details |
| `PATCH` | `/tasks/:taskId/status` | Update task status |
| `DELETE` | `/tasks/:taskId` | Delete a task |
| `GET` | `/users` | List assignable users |
| `POST` | `/notifications/deadline-reminders` | Trigger deadline-near reminder job |

Create payload:

```json
{
  "title": "Draft API contract",
  "description": "Define create/list/update schemas",
  "status": "todo",
  "assignedTo": "user-id-or-name",
  "dueDate": "2026-04-20"
}
```

Status update payload:

```json
{
  "status": "in-progress"
}
```

---

## UI & design guidelines

- **Glass surfaces:** `backdrop-blur`, translucent borders (`border-white/10`), layered shadows; avoid flat opaque panels on the main canvas.
- **Background:** Dark base + radial gradients; keep decorative layers `pointer-events-none` and behind content (`z-index`).
- **Motion:** Prefer short, eased transitions; stagger lists modestly; respect `prefers-reduced-motion` when you add global motion policy (Step 7).
- **Components:** Prefer ShadCN primitives and shared tokens in `src/index.css` over one-off magic numbers.
- **Responsiveness:** Mobile drawer for sidebar; test `sm` / `md` breakpoints whenever you touch layout.

---

## Future configuration

> Keep this updated as Steps 4–6 land. Step 3 variables are already active.

| Variable | Used when | Description |
|----------|-----------|---------------|
| `MONGODB_URI` | Step 3+ | MongoDB connection string |
| `PORT` | Step 3+ | API server port |
| `NOVU_API_KEY` | Step 6 | Novu secret for server triggers |
| `NOVU_BACKEND_URL` | Step 6 | Self-hosted Novu API URL |
| `NOVU_WORKFLOW_TASK_ASSIGNED` | Step 6 | Workflow ID for assignment notifications |
| `NOVU_WORKFLOW_TASK_COMPLETED` | Step 6 | Workflow ID for completion notifications |
| `NOVU_WORKFLOW_DEADLINE_NEAR` | Step 6 | Workflow ID for deadline reminder notifications |
| `VITE_API_URL` | Step 4+ | Frontend base URL for REST calls |

Add a `.env.example` at the repo root when you introduce environment variables, and describe each variable in one line here.

---

## Maintaining this README

1. **After each roadmap step:** Update the [Current status](#current-status) table and checkboxes in [Roadmap](#roadmap).
2. **Bump “Last README update”** with the date (and optionally a one-line note).
3. **Structure changes:** If you add `server/`, monorepo packages, or Docker, update [Repository structure](#repository-structure) and [Getting started](#getting-started).
4. **New env vars:** Add to [Future configuration](#future-configuration) and `.env.example`.
5. **Design decisions:** Short “Decision log” subsection (optional) can list choices like “Zustand for task draft state” or “Novu workflow names” for onboarding.

Keeping this file accurate costs minutes and saves hours.

---

## License

Private project — all rights reserved unless otherwise specified.
