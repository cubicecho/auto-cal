# Auto Cal — Feature Requests & Issues

> Status legend: `[ ]` open · `[x]` done · `[-]` in progress

---

## Recommended starting points

---

## P0 — Core correctness / blocking

### #1 — Wire magic-link email delivery (auth is otherwise live)
**Status:** Magic-link + JWT auth is implemented end-to-end:
- `requestMagicLink` / `verifyMagicLink` mutations exist (`packages/server/src/schema/resolvers/auth.ts`)
- JWT sign/verify via `jose` in `packages/server/src/auth.ts`
- Login flow (`/login`) and verify route (`/auth/verify`) live in the client
- Apollo client attaches `Bearer <token>` from `localStorage.auth_token`; expired-auth errors redirect to `/login`
- Server context extracts JWT first, falls back to raw UUID for dev/seed (dev-only, guarded by `NODE_ENV !== 'production'`)

**What's left:** The magic link is logged to the server console but no email is actually sent. In dev the `requestMagicLink` mutation also returns the link in the response; in prod the response has `magicLink: null`.

**Work:**
- Pick a provider (Resend or Nodemailer) and wire the send call in `requestMagicLink`'s resolver where the `// TODO: send email` comment lives
- Provider creds in env (`RESEND_API_KEY` or SMTP equivalent)
- Keep console logging as a fallback when no provider is configured

**Acceptance:** Requesting a magic link in production triggers an actual email; dev can still use console-logged links when no provider is set.

---

### #3 — Finish UTC migration ✓ Done
- `computeSchedule` now accepts a `timezone` parameter (IANA string) and emits UTC ISO strings (`Z` suffix) for `scheduledStart`/`scheduledEnd` using `fromZonedTime` from `date-fns-tz`.
- `mySchedule` passes `args.timezone` to `computeSchedule`; pinned todo and `completedAt` datetimes use `.toISOString()` directly.
- `ical-route.ts` passes `user.timezone` to `computeSchedule` and parses the result with `new Date(...)`.
- `CalendarView` and `ScheduleView` use `new Date(utcString)` which parses correctly; react-big-calendar renders in browser local time.

---

## P1 — High-value features

### #23 — Force reschedule escape hatch
**Problem:** Once a todo has been auto-scheduled, the scheduler preserves its `scheduledAt` on subsequent runs. There is currently no way for the user to explicitly evict a placed todo and let the scheduler re-place it.  
**Work:**
- Option A: add a `force: Boolean` flag to the `myReschedule` mutation — when true, clears `scheduledAt` on all (or selected) todos before running writeback
- Option B: expose a `myUnscheduleTodo(id: ID!)` mutation that sets `scheduledAt = null`, then let the next writeback pick it up

**Acceptance:** User can trigger a re-schedule of a todo that is already placed in a future slot.

---

### #8 — Notifications (browser push + in-app)
**Problem:** There's no alerting when a scheduled task is about to start, or when a habit streak is at risk.  
**Work:**
- Register a service worker for browser push notifications
- Add a `notification_preferences` table (lead time in minutes, which activity types)
- Server-side: a lightweight cron/setInterval to push notifications for tasks starting soon
- In-app toast for habit due-today reminders on dashboard load

**Acceptance:** User receives a browser notification 10 minutes before a scheduled task starts.

---

### #9 — Analytics page on `/stats` ✓ Done
**Note:** The route is `/stats`, not `/analytics` — the existing `/stats` route IS the surface this item describes; there is no separate `/analytics` planned.

**Status:** Built out in full — recharts BarChart for habit consistency, stat-row for todo throughput, activity type breakdown table, and a shared time-range filter (This week / This month / Last 3 months / All time). Composite score shows three cards (Weighted / Habit / Todo) with plain-English labels. All sections share date-range variables via `myStats` and `activityTypeStats(startDate, endDate)` + `myActivityTypes`.

---

## P2 — Quality of life

### #10 — URL-driven filters (TanStack Router search params)
**Problem:** Filters (activity type, completion status) are local React state — they reset on navigation and aren't shareable.  
**Work:**
- Migrate filter state to TanStack Router search params for `/todos`, `/habits`, `/time-blocks`
- Use `validateSearch` with Zod schemas
- Preserve filter on back/forward navigation

**Acceptance:** Filtering todos by activity type updates the URL; refreshing the page preserves the filter.

---

### #12 — Bulk complete / bulk delete todos
**Problem:** Completing or deleting todos one-by-one is tedious when clearing a backlog.  
**Work:**
- Add multi-select checkboxes to `TodoList`
- Toolbar appears when items are selected: "Complete selected", "Delete selected"
- Backend: batch mutations or multiple calls in a single Apollo request (via `Promise.all`)

**Acceptance:** User can select 5 todos and complete them all in one click.

---

### #14 — Recurrence exceptions for habits
**Problem:** The current habit model is rigid — there's no way to skip a specific instance (e.g., "skipping gym this Monday due to travel") without marking it as a full failure.  
**Work:**
- Add a `skipped` boolean to `habit_completions`
- Add a "skip this instance" action on scheduled habit slots
- Exclude skipped instances from streak and completion rate calculations
- Cap skips at 2 per period to prevent abuse

**Acceptance:** User can skip one habit instance; it shows as "skipped" in the history rather than "missed."

---


## P3 — Infrastructure & DX

### #15 — Expand test suite + CI
**Status:** Substantially done. Shipped:
- `.github/workflows/ci.yml` — runs codegen, typecheck, lint, and `npm test` on every PR and push to main; blocks merges on failure
- `packages/server/test/schema/resolvers/index.test.ts` — 3 resolver integration tests (PGLite in-memory) covering `myCreateActivityType`, `myCreateTodoList` + `myCreateTodo`, and `myCompleteTodo`
- `vitest.config.ts` updated with a `graphql` alias to prevent duplicate-module issues in the ESM test graph
- `packages/db/package.json` adds `./relations` export for use in test harnesses

Existing vitest suites:
- `packages/server/test/auth.test.ts` — JWT + magic-link helpers
- `packages/server/test/schema/validators.test.ts` — Zod validators
- `packages/server/test/services/scheduler.test.ts` — pure scheduler algorithm

**What's left:**
- Client component / route smoke tests
- Coverage targets (e.g. >80% on scheduler / resolvers)

**Acceptance:** PRs cannot merge with failing typecheck/lint/tests; resolver and validator paths are exercised end-to-end via PGLite.

---

### #16 — Postgres production path (dual-backend shipped, end-to-end test pending)
**Status:** The driver switch is implemented — `packages/db/src/index.ts` selects `postgres.js` when `DATABASE_URL` is set, PGLite otherwise. `docker-compose.yml` now defaults to the postgres backend.

**PGLite idle CPU (investigated 2026-05-27):** PGLite's Emscripten WASM glue (`postgres.js`) drives PostgreSQL's event loop via `setTimeout(MainLoop.runner, 0)` — a busy-wait that fires every event loop tick. Real Postgres uses OS-level sleep; the WASM port cannot. This results in significant idle CPU in Docker. The server now logs a warning when `PGLITE_DATA_DIR` is set in production. `docker-compose.yml` defaults to the real Postgres backend to avoid this. `relaxedDurability: true` is set on the PGLite client to reduce fsync-triggered `startPersist` timer frequency.

**What's left:**
- Run migrations against a real Postgres instance and confirm there are no PGLite-specific oddities (e.g. array column behavior in `time_blocks.daysOfWeek`)
- Smoke-test the app under a real Postgres deployment (concurrency, connection pooling)
- Decide on a connection-pool config (pg pool defaults, or pgBouncer)

**Acceptance:** A real Postgres deployment runs the full app without surprises; PGLite remains the no-config dev default.

