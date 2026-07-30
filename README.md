# Yimaru Admin Panel

Web admin console for **Yimaru Academy**. Team members manage LMS content (Learn English + Duolingo/IELTS), learners, subscriptions, payments, notifications, RBAC, analytics, and support workflows against the [Yimaru Backend](https://gitea.yaltopia.com/Yimaru/Yimaru-BackEnd) API.

| | |
|---|---|
| **Package** | `yimaru-admin` |
| **UI** | React 19 + TypeScript + Vite 7 |
| **Styling** | Tailwind CSS 3 + brand design tokens |
| **Routing** | React Router DOM 7 |
| **HTTP** | Axios (`src/api/http.ts`) with team JWT refresh |
| **Charts** | Recharts |
| **DnD** | `@dnd-kit` (content reorder) |
| **Remote** | `https://gitea.yaltopia.com/Yimaru/Yimaru-Admin.git` |
| **Branches** | `main`, `production` (keep both in sync for releases) |

Companion backend docs: see Backend `README.md` and `docs/*-admin-panel-integration.md`.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Getting started](#getting-started)
5. [Environment variables](#environment-variables)
6. [Scripts](#scripts)
7. [Authentication & session](#authentication--session)
8. [Routing map](#routing-map)
9. [Project structure](#project-structure)
10. [API client layer](#api-client-layer)
11. [Permissions (RBAC)](#permissions-rbac)
12. [Design system](#design-system)
13. [Key product areas](#key-product-areas)
14. [Local development tips](#local-development-tips)
15. [Build & deploy](#build--deploy)
16. [Troubleshooting](#troubleshooting)

---

## Features

- **Dashboard & Analytics** — KPIs, registrations, revenue trends, subscription/renewal metrics, video drop-off, demographics (tabbed Analytics: Learn English / Content Performance / Subscription & Revenue)
- **New content (primary CMS)** — Learn English programs & Duolingo/IELTS catalog; lessons, practices, question-type library; **Reorder Content** (`/new-content/reorder`)
- **Legacy content routes** — `/content/*` hierarchy still available for older flows
- **Users** — list, detail, groups, deletion requests, subscriptions & learning activity on user detail
- **Team** — members list/detail, invite dialog (email uniqueness check + role keys), accept-invite public page
- **Roles (RBAC)** — list/create roles, set permissions, bulk deactivate/reactivate, invite into a role
- **Notifications** — create, schedule, email templates
- **Payments & subscriptions** — payments list, subscription CSV export helpers
- **Issues, FAQs, personas, app ratings, activity logs (user log)**
- **Settings / profile / legal** — team profile, password change, public about/terms/privacy/account-deletion pages

---

## Tech stack

| Category | Libraries |
|----------|-----------|
| Runtime | React 19.2, React DOM |
| Language | TypeScript ~5.9 |
| Bundler | Vite 7.2 |
| Router | `react-router-dom` 7.10 |
| Styling | Tailwind 3.4, `clsx`, `tailwind-merge`, CVA |
| UI primitives | Radix (dialog, dropdown, avatar, separator, slot) |
| Icons | `lucide-react` |
| State | Zustand (`src/zustand`) + React local state |
| HTTP | Axios |
| Charts | Recharts 3 |
| Drag & drop | `@dnd-kit/core` + sortable |
| Uploads | `tus-js-client` (Vimeo / resumable where used) |
| Toasts | Sonner |
| Font | Inter (`@fontsource/inter`) |

---

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **npm** (lockfile: `package-lock.json`)
- Running **Yimaru Backend** with CORS / network access from the Vite origin
- Team account with appropriate RBAC permissions

---

## Getting started

```bash
git clone https://gitea.yaltopia.com/Yimaru/Yimaru-Admin.git
cd Yimaru-Admin

npm install

# Create env (see below)
cp .env .env.example  # if you maintain an example; otherwise create .env

npm run dev
```

Default Vite URL: `http://localhost:5173` (unless configured otherwise).

Point `VITE_API_BASE_URL` at the backend, including the API prefix if required, for example:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

(Exact port/path must match your backend `PORT` and route group.)

---

## Environment variables

Vite only exposes variables prefixed with `VITE_`.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Axios `baseURL` for all `src/api/*` calls |
| `VITE_GOOGLE_CLIENT_ID` | For Google team login | Google OAuth client ID used by admin login |

Create a local `.env` (do not commit secrets). Example:

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Backend must set `TEAM_INVITE_BASE_URL` / `TEAM_PASSWORD_RESET_BASE_URL` to this app’s origin (e.g. `https://admin.example.com/accept-invite` patterns as documented in backend team docs).

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Vite HMR |
| Build | `npm run build` | Production bundle (`vite build`) |
| Preview | `npm run preview` | Serve production build locally |
| Lint | `npm run lint` | ESLint |

Build embeds `__BUILD_HASH__` (git short SHA) and `__BUILD_TIME__` via `vite.config.ts`.

---

## Authentication & session

Admin auth is **team-member** based (not learner `users` table).

### Public routes

| Path | Purpose |
|------|---------|
| `/login` | Email/password (and Google if configured) |
| `/forgot-password` | Request reset email |
| `/reset-password` | Complete reset with OTP from link |
| `/verification` | OTP verification UI where used |
| `/accept-invite` | Complete invitation (profile + password) |
| `/about`, `/terms`, `/privacy`, `/account-deletion` | Public / legal |

### Session storage

Tokens and metadata are stored in browser storage via `src/lib/teamAuthStorage` (access token, refresh token, `member_id`, `team_role`, …).

`src/api/http.ts`:

- Attaches `Authorization: Bearer <access_token>`
- Proactively refreshes when access JWT is near expiry
- Queues concurrent 401s during `POST /team/refresh`
- Clears session and redirects to `/login` on hard auth failure
- Suppresses toast noise for unauthenticated bootstrap races

`App.tsx` bootstraps browser session **before** first paint to avoid spurious 401 toasts on protected loads.

### Invite roles

When inviting, send **API role keys** (e.g. `SUPER_ADMIN`) or exact RBAC role names / numeric ids — not display labels alone. Helpers: `src/lib/teamRoles.ts` (`teamRoleNameForInvite`, `rbacRolesToTeamRoleOptions`).

Invite dialog validates emails against existing team members before send (`fetchAllTeamMemberEmails`).

---

## Routing map

Defined in `src/app/AppRoutes.tsx`. Authenticated shell: `AppLayout` (sidebar + topbar).

| Area | Base path | Notes |
|------|-----------|--------|
| Dashboard | `/dashboard` | Default after `/` |
| Analytics | `/analytics` | Tabbed analytics UI |
| Users | `/users/list`, `/users/:id`, groups, deletion-requests | |
| Roles | `/roles`, `/roles/add` | RBAC |
| New content | `/new-content`, `/new-content/reorder`, courses, practices, question-types | Primary CMS |
| Legacy content | `/content/*` | Older category/course flows |
| Team | `/team`, `/team/add`, `/team/:id` | |
| Notifications | `/notifications/*`, email templates | |
| Payments | `/payments` | |
| Subscriptions export | `/subscriptions/export` (or related) | See routes file |
| Issues | `/issues` | Statuses: pending, in_progress, resolved, **rejected** (not `closed`) |
| FAQs | `/faqs` | |
| Personas | `/personas` | |
| App reviews | `/ratings` (app reviews page) | |
| User log | `/user-log` | Activity logs |
| Profile / settings | `/profile`, `/settings` | |

Always check `AppRoutes.tsx` for the canonical path list when adding pages.

---

## Project structure

```
Yimaru-Admin/
├── public/                 # Static assets
├── docs/                   # Front-end integration notes (e.g. course management)
├── src/
│   ├── api/                # Axios API modules (one domain per file)
│   ├── app/                # AppRoutes
│   ├── assets/             # Images, SVGs
│   ├── components/
│   │   ├── analytics/      # Shared analytics UI primitives
│   │   ├── dashboard/      # StatCard, RevenueTrendCard, …
│   │   ├── sidebar/        # Navigation
│   │   ├── topbar/
│   │   ├── ui/             # Button, Card, Dialog, …
│   │   └── …
│   ├── contexts/           # React contexts
│   ├── hooks/
│   ├── layouts/            # AppLayout
│   ├── lib/                # utils, teamAuth, teamRoles, analytics helpers, …
│   ├── pages/              # Route-level screens (by domain)
│   ├── types/              # Shared TS types mirroring API payloads
│   ├── zustand/            # Global stores
│   ├── App.tsx
│   ├── index.css           # Tailwind + CSS variables
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## API client layer

| File | Domain |
|------|--------|
| `http.ts` | Shared Axios instance + interceptors |
| `team.api.ts` / `teamRefresh.api.ts` | Team auth, members, invites |
| `auth.api.ts` | Auth helpers as needed |
| `analytics.api.ts` | Dashboard analytics |
| `courses.api.ts` | LMS + exam-prep content & reorder |
| `users.api.ts` | Learners |
| `rbac.api.ts` | Roles & permissions |
| `notifications.api.ts` / `emailTemplates.api.ts` | Messaging |
| `payments.api.ts` / `subscription-plans.api.ts` / `admin-subscriptions.api.ts` | Monetization |
| `issues.api.ts`, `faq.api.ts`, `ratings.api.ts`, `personas.api.ts` | Support content |
| `files.api.ts` | Uploads |
| `activity-logs.api.ts` | Audit trail |
| `questionTypeDefinitions.api.ts` / `questionTypeDefinitionGroups.api.ts` | Dynamic Q types |
| `app-versions.api.ts` | Mobile version gates |

Error UX: `src/lib/apiErrors.ts` (`notifyApiError`, `getApiErrorMessage`). Prefer `skipErrorToast: true` on invite/auth calls that handle errors inline.

Backend integration contracts: Backend repo `docs/*-admin-panel-integration.md`.

---

## Permissions (RBAC)

- Sidebar / actions should gate on **permission keys** returned for the signed-in team member (see `fetchCurrentTeamMemberPermissions` in `team.api.ts`), not only `team_role === "ADMIN"`.
- Custom roles use their RBAC name in JWT after login; built-ins map via backend `PlatformRole()` / `RBACRoleForJWT()`.
- Role management UI: invite into a role, assign permissions, bulk deactivate/reactivate users + team members for a role.

---

## Design system

Defined in `tailwind.config.js` and `src/index.css`.

### Brand

| Token | Usage |
|-------|--------|
| `brand-500` (`#9E2891`) | Primary actions, active tabs, chart strokes |
| `brand-100`–`600` | Surfaces / hover |
| `gold-*` | Accents |
| `mint-*` | Positive trends / success pills |
| `grayScale-50`–`600` | Neutrals (CSS variables `--gs-*`) |

### UI patterns (Dashboard / Analytics)

Shared building blocks: `src/components/analytics/analytics-ui.tsx`

- Page title + underline tabs (brand underline)
- Section intro + optional **Export Report**
- Filter bar + **Reset Filters**
- KPI cards: label + thin icon, large value, trend pill
- Soft white cards (`rounded-xl`, thin border, minimal shadow)
- Purple area charts with gradient fill and dots

### Components

Base UI under `src/components/ui/` (Button, Card, Dialog, Input, Select, Table, …). Prefer these over one-off styles.

---

## Key product areas

### Analytics (`/analytics`)

Tabs:

1. **Learn English** — users, LMS KPIs, demographics, team
2. **Content Performance** — videos, questions, issues, notifications, drop-off
3. **Subscription & Revenue** — revenue trend, plans donut, renewal gauge, churn series

Data: `GET /analytics/dashboard` (via `getDashboard`) with date filters (`AnalyticsTimeRangeFilter`).

### Reorder content (`/new-content/reorder`)

- Tabs: **Learn English** | **Duolingo/IELTS**
- Drag-and-drop lists; persist on drop via reorder APIs in `courses.api.ts`
- Compact hierarchy UI in `ContentHierarchyList` / `ExamPrepContentHierarchyList`

### Team invites

- Dialog: multi-email parse, role select from RBAC list, block already-registered emails
- Issue statuses in Issues UI use API-valid values (`rejected` instead of invalid `closed`)

---

## Local development tips

1. Run backend (`make air` / Compose) before the admin SPA.
2. Use a team account seeded with `SUPER_ADMIN` or a role that has the permissions you need.
3. If API base URL changes, restart Vite so `import.meta.env` updates.
4. For invite links in local/dev, align backend `TEAM_INVITE_BASE_URL` with `http://localhost:5173/...`.
5. Prefer TypeScript types in `src/types/*` matching backend JSON (`snake_case` fields).

Course-oriented notes: `docs/course-management-api-integration.md` (if present).

---

## Build & deploy

```bash
npm run lint
npm run build
```

Serve the `dist/` folder behind HTTPS (nginx, CDN, etc.).

Recommended branch flow (this repo’s practice):

1. Commit on `main`
2. Push `main`
3. Fast-forward / merge into `production` and push `production`

Configure hosting env with production `VITE_API_BASE_URL` at **build time** (Vite inlines env at build).

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|-------------------|
| Network / CORS errors | Wrong `VITE_API_BASE_URL`; backend CORS; mixed http/https |
| Instant redirect to login | Missing/expired refresh token; call `/team/refresh` failing |
| Spurious “Authorization header missing” toasts | Ensure latest `App.tsx` session bootstrap + `http.ts` unauth handling |
| Invite `invalid team role: "Super Admin"` | Send `SUPER_ADMIN` (fixed in `teamRoles.ts`; backend also accepts display labels for built-ins) |
| Invite “email already exists” | Member (or pending invite) already in `team_members` — dialog should block known emails |
| Issue status PATCH fails | Use `rejected`, not `closed` |
| Empty analytics | Backend dashboard error; check date filter + permissions |
| Google login broken | `VITE_GOOGLE_CLIENT_ID` + backend Google OAuth env |

---

## Related repositories

| Repo | Role |
|------|------|
| [Yimaru-BackEnd](https://gitea.yaltopia.com/Yimaru/Yimaru-BackEnd) | REST API, migrations, Swagger |
| [Yimaru-Admin](https://gitea.yaltopia.com/Yimaru/Yimaru-Admin) | This admin SPA |

---

## License

Proprietary — Yaltopia / Yimaru Academy. Internal use only unless otherwise licensed.

---

Developed by **Yaltopia Tech** for **Yimaru Academy**.
