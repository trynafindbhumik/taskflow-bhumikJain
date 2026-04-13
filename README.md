# TaskFlow

> A modern, opinionated task management interface built as a take-home frontend assignment.

TaskFlow lets teams create projects, manage tasks across status columns, assign work to members, and track deadlines — all inside a clean, dark-mode-capable UI powered by Next.js and mocked with MSW.

---

## 1. Overview

**What it is:** A single-page-application-style frontend for a task management product. You can log in, create projects, drag tasks between status columns, filter by priority and assignee, invite team members, and track upcoming deadlines — all without touching a real backend. Every API call is intercepted by [Mock Service Worker (MSW)](https://mswjs.io/), which runs a realistic in-memory data layer entirely in the browser.

**What it does (feature by feature):**

- **Authentication** — Login and Register forms with Zod + React Hook Form validation, JWT stored in a cookie, user info persisted in `localStorage`.
- **Dashboard** — Greeting, four live stat cards (completed/in-progress/high-priority/projects), project cards grid, and a paginated upcoming-deadlines list.
- **Projects** — Full CRUD with grid and list view toggles, pagination, and per-card context menus.
- **Project Detail (Kanban board)** — Three-column board (To Do / In Progress / Done) with drag-and-drop reordering and cross-column moves. Also ships a list view with inline filters.
- **Task Management** — Create via modal, edit via slide-in side sheet, quick status-cycle on the status button. Optimistic UI: status changes apply instantly and revert silently on error.
- **Filters** — Search, status, priority, and assignee dropdowns, all live-filtering the visible tasks without a round trip.
- **Members** — Add/remove project members, quick-add from the existing user pool, or "invite" by email.
- **Notifications** — Bell icon with unread badge, panel with mark-as-read and mark-all-read.
- **Global Search** — `⌘K` modal, debounced 300 ms, searches projects and tasks, remembers recent queries in memory.
- **Profile** — Edit display name, pick an avatar accent colour, optionally change password.
- **Settings** — Light/dark theme toggle (persists via `localStorage`), notification toggle, default task-view preference (board vs list).
- **Dark mode** — Full dark theme via CSS custom properties on `[data-theme="dark"]`, togglable in Settings or the auth screen.

**Tech stack:**

| Concern            | Choice                                               |
| ------------------ | ---------------------------------------------------- |
| Framework          | Next.js 16.2.3 (App Router)                          |
| Language           | TypeScript (strict)                                  |
| Styling            | CSS Modules + custom design tokens via CSS variables |
| Forms              | React Hook Form + Zod                                |
| Mocking            | MSW 2.x (browser service worker)                     |
| Auth state         | `js-cookie` (token) + `localStorage` (user object)   |
| Icons              | Lucide React                                         |
| Linting/Formatting | ESLint (with Next.js + TypeScript config) + Prettier |
| Containerisation   | Docker (multi-stage build) + Docker Compose          |

---

## 2. Architecture Decisions

### Why Next.js instead of plain React + React Router?

The project guidelines say "React Router for navigation" but that's listed in the context of a plain React SPA. I chose Next.js because it ships file-based routing, a proper dev server, and first-class TypeScript support out of the box — all things I'd want in a real product. The result behaves identically to a React Router app for this scope (no SSR is actually leveraged, every page is a client component), but the project structure is cleaner and closer to how I'd deliver something production-bound.

### Why CSS Modules instead of a component library?

The guidelines say "use a component library _or build your own_ — state your choice." I built my own. The reason: component libraries like shadcn/ui or MUI bring opinionated defaults that are hard to override consistently. A hand-rolled system with CSS custom properties gave me full control over the red-primary brand colour, the exact shadow scale, and the dark-mode token swap — without fighting library specificity or fighting the cascade. Every visual token (colour, radius, shadow, transition easing) lives in `:root` and `[data-theme="dark"]` blocks in `globals.css`, making global changes a single-line edit.

### Why MSW for mocking?

MSW intercepts fetch at the Service Worker level, which means the actual `apiFetch` utility runs unchanged. No conditional `if (process.env.MOCK)` branches in the business logic, no mock adapters to maintain. The in-memory store in `handlers.ts` is a direct mirror of the data model described in the spec (Users, Projects, Tasks, Members, Notifications), so swapping to a real API is a matter of changing the `BASE_URL` and removing the `MSWProvider` wrapper — nothing else needs to touch.

### MSW in Docker / Production

MSW runs entirely in the browser as a registered service worker — it is **not** a server-side concern. When the Docker image is built, `public/mockServiceWorker.js` is bundled with the app's static assets and served to the browser. On first load the service worker registers and intercepts every fetch to `http://localhost:4000/*`, returning realistic mock responses. This means:

- **Zero backend container required** — `docker compose up` spins up only the Next.js app.
- **NEXT_PUBLIC_API_URL is baked at build time** — the value `http://localhost:4000` is the right default because MSW intercepts before any network packet leaves the browser; the backend host is never actually contacted.
- **Works offline** — because there is no network dependency at runtime.

### Why `output: 'standalone'` in next.config.ts?

Next.js's standalone output mode traces the exact files each page needs and produces a self-contained server bundle under `.next/standalone`. The Docker runner stage copies **only** that directory plus `.next/static` and `public` — there is no `node_modules` copy step. This results in a minimal final image (typically 100–150 MB vs 500+ MB for a naïve copy) with a smaller attack surface.

### Optimistic UI approach

Task status changes (clicking the status button on a card, or drag-and-drop) update React state immediately, then fire the PATCH in the background. If the PATCH fails, the previous state snapshot is restored and a toast is shown. This keeps the board feeling snappy even on slow connections and is implemented in `handleStatusChange` in `ProjectDetails.tsx` with a simple `prev` capture before the optimistic mutation.

### What I deliberately left out

- **Real-time updates** (WebSocket/SSE) — the guidelines list this as a bonus. Given the mocked backend, a fake SSE would have been cosmetic noise rather than demonstrable value.
- **E2E tests** — would have added meaningful confidence but were out of time.
- **Infinite scroll** for the projects page — went with classic pagination instead; simpler to reason about and sufficient for the scope.

---

## 3. Running Locally

### Option A — Docker (recommended for reviewers)

**Prerequisites:** Docker Desktop (or Docker Engine + Compose plugin). Nothing else needed — no Node.js, no pnpm, no database.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/taskflow-bhumik-jain
cd taskflow-bhumik-jain

# 2. Create the environment file
cp .env.example .env
# The defaults in .env.example are correct — no edits required.

# 3. Build the image and start the container
docker compose up --build

# App is live at http://localhost:3000
# → Redirects to /login automatically.
# → Use the test credentials below to log in.
```

To run in the background:

```bash
docker compose up --build -d
docker compose logs -f   # follow logs
docker compose down      # stop and remove containers
```

> **First-load note:** On the very first page visit the browser registers the MSW service worker. If the screen stays blank, a hard refresh (`⌘R` / `Ctrl+R`) resolves it.

---

### Option B — Local dev server (pnpm)

**Prerequisites:** Node.js 20+ and pnpm.

```bash
# 1. Clone and install
git clone https://github.com/your-username/taskflow-bhumik-jain
cd taskflow-bhumik-jain
pnpm install

# 2. Environment
cp .env.example .env.local   # values are the same; Next.js reads .env.local in dev

# 3. Start the dev server
pnpm dev

# App is live at http://localhost:3000
```

---

## 4. Running Migrations

Not applicable for this submission. There is no database — all data lives in the MSW in-memory store (`src/mocks/handlers.ts`). The seed data (projects, tasks, users, notifications) is initialised when the module loads and resets on page refresh.

If you were wiring this to a real backend, you would run the backend's migration command here (e.g., `migrate up` for golang-migrate). The frontend itself has no migration step.

---

## 5. Test Credentials

The MSW seed includes one pre-built user. Log in with:

```
Email:    test@example.com
Password: password123
```

This user is `John Doe` (id: `u1`), owner of the _Website Redesign_ and _Mobile App_ projects and a member of _Marketing Campaign_. All three projects come pre-loaded with tasks across different statuses so you can immediately see the board in action.

**Register works too** — the Register form creates a new in-memory user and logs you in. That session lasts until you refresh (since MSW state is in-memory), so the test credentials above are the reliable path for a review session.

---

## 6. API Reference

This project is built against the **Mock API spec** from Appendix A of the guidelines. All requests are intercepted by MSW in the browser — no real server exists. Below is a summary of every endpoint the frontend calls.

All endpoints expect and return `application/json`. Protected endpoints require `Authorization: Bearer <token>`.

### Authentication

**`POST /auth/register`**

```json
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }

// Response 201
{ "token": "<jwt>", "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" } }
```

**`POST /auth/login`**

```json
// Request
{ "email": "test@example.com", "password": "password123" }

// Response 200
{ "token": "<jwt>", "user": { "id": "uuid", "name": "John Doe", "email": "test@example.com" } }
```

**`PATCH /auth/profile`** — update display name or password

```json
// Request
{ "name": "New Name", "new_password": "newpass123" }

// Response 200 — returns updated user object
{ "id": "uuid", "name": "New Name", "email": "test@example.com" }
```

---

### Projects

**`GET /projects?page=1&limit=9`**

```json
// Response 200
{
  "projects": [{ "id": "p1", "name": "Website Redesign", "owner_id": "u1", "created_at": "..." }],
  "total": 3,
  "has_more": false
}
```

**`POST /projects`**

```json
// Request
{ "name": "New Project", "description": "Optional" }
// Response 201 — returns created project
```

**`GET /projects/:id`** — returns single project object

**`PATCH /projects/:id`**

```json
// Request
{ "name": "Updated Name", "description": "Updated description" }
// Response 200 — returns updated project
```

**`DELETE /projects/:id`** — Response 204 No Content. Cascades to tasks and members.

---

### Project Members

**`GET /projects/:id/members`** — returns `ProjectMember[]`

**`POST /projects/:id/members`**

```json
// Request
{ "user_id": "u2" }
// Response 201 — returns the ProjectMember record
```

**`DELETE /projects/:id/members/:userId`** — Response 204. Returns 403 if target is project owner.

---

### Tasks

**`GET /projects/:id/tasks?status=todo`** — returns `Task[]`, optional `status` filter

**`POST /projects/:id/tasks`**

```json
// Request
{
  "title": "Design homepage",
  "description": "...",
  "status": "todo",
  "priority": "high",
  "assignee_id": "u2",
  "due_date": "2026-04-15"
}
// Response 201 — returns created task
```

**`PATCH /tasks/:id`** — all fields optional, returns updated task

**`DELETE /tasks/:id`** — Response 204

---

### Dashboard Extras

**`GET /stats`** — returns `{ total, done, in_progress, high_priority }`

**`GET /deadlines?limit=5&offset=0`** — returns `{ tasks: DeadlineTask[], total, has_more }`

---

### Search & Notifications

**`GET /search?q=<query>`** — returns `{ projects: Project[], tasks: Task[] }`

**`GET /notifications`** — returns `Notification[]`

**`PATCH /notifications/:id/read`** — marks one notification read

**`POST /notifications/read-all`** — marks all notifications read

---

### Users

**`GET /users`** — returns `User[]` (used by the Members panel to populate the "quick add" list)

---

### Error shape (all errors)

```json
// 400
{ "error": "validation failed", "fields": { "email": "is required" } }
// 401
{ "error": "unauthorized" }
// 404
{ "error": "not found" }
```

---

## 7. What I'd Do With More Time

**The honest shortcut list:**

- **No automated tests** — The codebase has zero test files. I'd add Playwright E2E tests for the three critical paths (login → create project → create task → change status) and Vitest unit tests for the `apiFetch` utility and the MSW handlers. That coverage would catch regressions in the optimistic UI rollback logic, which is the trickiest part.

- **MSW state resets on refresh** — The in-memory store is module-level, so a hard refresh wipes everything you created. A real product uses a persistent API. If I had to keep the MSW approach but make it feel more persistent, I'd back the store with `localStorage` via a thin serialisation layer in `handlers.ts`.

- **Accessibility gaps** — The drag-and-drop board has no keyboard interface. Screen reader users can't reorder tasks. Fixing this with `@dnd-kit/core`'s accessibility announcements (or simply adding a "Move to…" select fallback on each card) is the most important a11y improvement I'd make.

- **The `TaskColumn` scroll area** — On a board with many tasks the column clips at `max-height: calc(100vh - 260px)`. On very small viewports with the filter bar open this causes columns to become unusably short. A virtualised list (e.g., `@tanstack/react-virtual`) would fix this and also handle large task counts gracefully.

- **Real-time** — The notification panel polls on open. A WebSocket (or at minimum SSE) connection would make the unread badge react instantly to server-pushed events. The architecture is ready for it — the Notification context just needs a subscription hook instead of a one-shot fetch.

- **Search is in-memory** — The current search runs entirely inside the MSW handler over the in-memory array. On a real backend with thousands of tasks, you'd want a proper full-text index (PostgreSQL `tsvector`, Meilisearch, etc.). The `SearchModal` component is backend-agnostic, so this is entirely a backend concern.

- **Larger `ProjectDetails.tsx`** — At ~400 lines this component does too much. I'd extract the task form logic into a `useTaskForm` hook, the members panel into its own `MembersSheet` component, and the filter state into a `useTaskFilters` hook. The component itself would shrink to ~150 lines of composition.

---

_Built by Bhumik Jain · TaskFlow take-home assignment_
