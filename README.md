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
| Step 3 — Backend setup | Not started | Express, MongoDB, Task model, REST endpoints. |
| Step 4 — Connect frontend ↔ API | Not started | Replace dummy data, loading and error handling. |
| Step 5 — Users & assignment | Not started | User model, assign tasks, show assignee in UI. |
| Step 6 — Novu integration | Not started | Triggers: assigned, completed, deadline near. |
| Step 7 — UI polish | Not started | Micro-interactions, skeletons, empty states, responsiveness. |

**Last README update:** 2026-04-09 (Steps 1–2 complete).

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

### Step 3 — Backend setup

- [ ] Express app and project layout: `controllers/`, `models/`, `routes/`, `services/`, `config/`
- [ ] MongoDB connection (Mongoose)
- [ ] **Task** schema: `title`, `description`, `status`, `assignedTo`, `dueDate`, `createdAt`
- [ ] APIs: create task, list tasks, update status

### Step 4 — Connect frontend + backend

- [ ] API client in `src/services/`
- [ ] Replace dummy data with real requests
- [ ] Loading and error states in UI

### Step 5 — Users + assignment

- [ ] **User** model and minimal user APIs or seed data
- [ ] Assign task to user; persist `assignedTo`
- [ ] Show assignee on cards / detail views

### Step 6 — Novu integration

- [ ] Novu SDK on server; environment config for self-hosted instance
- [ ] Subscribers: `subscriberId` + email (or project convention)
- [ ] Triggers: task assigned, task completed, deadline approaching

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

Optional later: **MongoDB**, **Novu** instance URLs and API keys (document under [Future configuration](#future-configuration)).

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

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
| `npm run build` | Typecheck (`tsc -b`) + production bundle |
| `npm run preview` | Serve the `dist/` output locally |
| `npm run lint` | ESLint across the project |

---

## UI & design guidelines

- **Glass surfaces:** `backdrop-blur`, translucent borders (`border-white/10`), layered shadows; avoid flat opaque panels on the main canvas.
- **Background:** Dark base + radial gradients; keep decorative layers `pointer-events-none` and behind content (`z-index`).
- **Motion:** Prefer short, eased transitions; stagger lists modestly; respect `prefers-reduced-motion` when you add global motion policy (Step 7).
- **Components:** Prefer ShadCN primitives and shared tokens in `src/index.css` over one-off magic numbers.
- **Responsiveness:** Mobile drawer for sidebar; test `sm` / `md` breakpoints whenever you touch layout.

---

## Future configuration

> Fill in as Steps 3–6 land. Example shape:

| Variable | Used when | Description |
|----------|-----------|---------------|
| `MONGODB_URI` | Step 3+ | MongoDB connection string |
| `PORT` | Step 3+ | API server port |
| `NOVU_API_KEY` | Step 6 | Novu secret for server triggers |
| `NOVU_BACKEND_URL` | Step 6 | Self-hosted Novu API URL |
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
