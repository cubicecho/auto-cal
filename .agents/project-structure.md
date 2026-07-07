# Project Structure — Auto Cal

> Index/overview. For deeper dives see the sibling `.agents/` files: `db-patterns.md`, `server-patterns.md`, `graphql-patterns.md`, `client-patterns.md`, `scheduling.md`, `deployment.md`.

## 1. Overview

Auto Cal is a smart todo + habit scheduling app. Users create **todo lists** (grouped by activity type), **todos** (one-shot tasks that belong to a list), and **habits** (repeated targets), which the scheduler places into user-defined **time blocks** by priority and activity type. Stats track habit consistency and todo throughput per activity type.

The repo is a **npm workspace** monorepo (`workspaces: ["packages/*"]` in the root `package.json`). There is no `pnpm-workspace.yaml` and no `sst.config.ts`.

| Package | Role |
|---------|------|
| `packages/db/` | Drizzle ORM schema, PGLite/Postgres connection, seed + migration runners |
| `packages/server/` | Node 22 GraphQL API (Express + Apollo) — runs `.ts` directly via `--experimental-strip-types` |
| `packages/client/` | React + Vite + Apollo Client + TanStack Router + ShadCN/Tailwind |

Key tech choices: **Biome** (lint+format), `@vantreeseba/drizzle-graphql` (auto-generates GraphQL schema from Drizzle tables — feature-fork of upstream), **PGLite** (embedded Postgres default; swap to real Postgres via `DATABASE_URL`), **vitest** for tests.

---

## 2. Package Layout

### `packages/db/`

```
packages/db/src/
├── index.ts            # PGLite/Postgres dual-backend, exports `db` instance
├── schema.ts           # Aggregates all model exports
├── relations.ts        # Drizzle relations
├── migrator.ts         # Programmatic drizzle-kit migrate (used by Dockerfile)
└── models/
    ├── enums.ts            # ACTIVITY_TYPES, FREQUENCY_UNITS, etc.
    ├── index.ts            # Re-exports all models
    ├── users.ts
    ├── activity_types.ts
    ├── todo_lists.ts
    ├── todos.ts
    ├── habits.ts
    ├── time_blocks.ts
    └── habit_completions.ts

packages/db/drizzle/         # Generated migrations — never edit manually
```

### `packages/server/`

```
packages/server/src/
├── index.ts                  # Express + Apollo bootstrap, auth context
├── auth.ts                   # JWT sign/verify (jose), magic-link token helpers
├── auth.test.ts
├── context.ts                # GraphQL Context type + DataLoader factory
├── ical-route.ts             # GET /ical?userId=… — public iCal feed
├── routes/
│   └── auth.ts               # Magic-link HTTP route handlers (if any)
├── services/
│   ├── scheduler.ts          # Pure scheduling algorithm
│   ├── scheduler.test.ts
│   └── scheduler-writeback.ts # DB-backed wrapper, fire-and-forget
├── schema/
│   ├── index.ts              # buildSchema → applyCustomResolvers → blockUnscoped
│   ├── validators.ts         # Zod validators for resolver inputs
│   ├── validators.test.ts
│   └── resolvers/
│       ├── index.ts          # extensionSDL + wires apply* functions
│       ├── todo-lists.ts
│       ├── todos.ts
│       ├── habits.ts
│       ├── time-blocks.ts
│       ├── activity-types.ts
│       ├── schedule.ts
│       ├── stats.ts
│       ├── profile.ts
│       └── auth.ts
└── __generated__/            # Server schema + resolver types (codegen output)
    ├── schema.graphql
    └── resolvers.ts
```

Imports **must** include `.ts` extension (Node 22 `--experimental-strip-types`).

### `packages/client/`

```
packages/client/src/
├── main.tsx              # App entry — Apollo + Router providers
├── lib/utils.ts          # cn(), priorityLabel()
├── hooks/                # form-hook, etc.
├── components/
│   ├── ui/               # ShadCN primitives + custom (route-error, inline-length-edit)
│   └── domain/
│       ├── activity-type/
│       ├── todo/
│       ├── todo-list/
│       ├── habit/
│       └── time-block/
├── routes/               # File-based TanStack Router
│   ├── __root.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── auth.verify.tsx
│   ├── onboarding.tsx
│   ├── dashboard.tsx
│   ├── todos.tsx
│   ├── todo-lists.tsx
│   ├── habits.tsx
│   ├── habits.index.tsx
│   ├── habits.$habitId.tsx
│   ├── time-blocks.tsx
│   ├── activity-types.tsx
│   ├── stats.tsx
│   └── settings.tsx
└── __generated__/        # GraphQL Codegen output (gitignored)
    ├── gql.ts
    └── graphql.ts
```

There is no centralized `App.tsx` — routing and providers live in `main.tsx`.

---

## 3. Database Schema

Full column definitions live in `packages/db/src/models/`. Summary:

**`users`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, defaultRandom |
| email | text | notNull, unique |
| timezone | text | notNull, default `'UTC'` (IANA zone) |
| createdAt / updatedAt | timestamp | defaultNow |

**`activity_types`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK users (cascade delete) |
| name | text | notNull |
| color | text | notNull, default `'#6366f1'` (hex with `#`) |
| createdAt / updatedAt | timestamp | |

**`todo_lists`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK users (cascade delete) |
| name | text | notNull |
| description | text | nullable |
| activityTypeId | uuid | FK activity_types (restrict) — notNull |
| defaultPriority | integer | notNull, default 0 — seeded into new todos |
| defaultEstimatedLength | integer | notNull, default 0 — seeded into new todos |
| createdAt / updatedAt | timestamp | |

**`todos`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK users (cascade delete) |
| listId | uuid | FK todo_lists (restrict) — notNull. Activity type derives from the list. |
| title | text | notNull |
| description | text | nullable |
| priority | integer | notNull, default 0 |
| estimatedLength | integer | notNull (minutes; 0 = unestimated) |
| dueAt | timestamp | nullable — hard deadline (separate from `scheduledAt`) |
| scheduledAt | timestamp | nullable |
| completedAt | timestamp | nullable |
| manuallyScheduled | boolean | notNull, default false |
| createdAt / updatedAt | timestamp | |

**`habits`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK users (cascade delete) |
| title | text | notNull |
| description | text | nullable |
| priority | integer | notNull, default 0 |
| estimatedLength | integer | notNull |
| activityTypeId | uuid | FK activity_types (restrict) — notNull |
| frequencyCount | integer | notNull (e.g. 3) |
| frequencyUnit | text | notNull, `'week' \| 'month'` (typed via `$type<FrequencyUnit>`) |
| createdAt / updatedAt | timestamp | |

**`time_blocks`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK users (cascade delete) |
| activityTypeId | uuid | FK activity_types (restrict) — notNull |
| daysOfWeek | integer[] | notNull (0=Sun … 6=Sat) |
| startTime | text | `'HH:mm'` |
| endTime | text | `'HH:mm'` |
| priority | integer | notNull, default 0 |
| createdAt / updatedAt | timestamp | |

**`habit_completions`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| habitId | uuid | FK habits (cascade delete) |
| scheduledAt | timestamp | nullable — set for tentative (scheduler-generated) rows |
| completedAt | timestamp | nullable — set for actual completions; null = tentative |
| createdAt | timestamp | |

Conventions: all PKs use `uuid`+`defaultRandom`; user-owned tables cascade-delete; required references to activity-type / list use `onDelete: 'restrict'`; timestamps are `timestamp` (not `timestamptz`). Types are inferred via `$inferSelect` / `$inferInsert` — never duplicated.

---

## 4. GraphQL Schema (high level)

The base schema is auto-generated from Drizzle by `@vantreeseba/drizzle-graphql`, then extended in `packages/server/src/schema/resolvers/index.ts` (`extensionSDL`) and locked down by `blockUnscopedResolvers()` so only `my*` fields and the `PUBLIC_MUTATIONS` set are reachable. Full SDL details in `graphql-patterns.md` and `server-patterns.md`.

### Queries (`my*` scoped)

| Query | Notes |
|-------|-------|
| `myProfile` | Returns `UserProfile` (id, email, timezone) |
| `myActivityTypes` | All activity types for the user |
| `myTodoLists` | All todo lists for the user |
| `myTodos(listId, completed, orderBy)` | Filterable; orderBy via `TodoOrderBy` |
| `myHabits(activityTypeId)` | |
| `myTimeBlocks(activityTypeId, containsDay)` | |
| `mySchedule(weekStart, timezone)` | Live-recomputed schedule for the week (see `scheduling.md`) |
| `myStats(startDate, endDate)` | Composite + per-habit + todo summary |
| `myHabitDetail(habitId, periods)` | Per-period rates for a habit |
| `activityTypeStats(startDate, endDate)` | |
| `habitStats(habitId, startDate, endDate)` | |

### Mutations (`my*` scoped)

| Domain | Mutations |
|--------|-----------|
| Profile | `myUpdateProfile` |
| Activity types | `myCreateActivityType`, `myUpdateActivityType`, `myDeleteActivityType` |
| Todo lists | `myCreateTodoList`, `myUpdateTodoList`, `myDeleteTodoList` |
| Todos | `myCreateTodo`, `myUpdateTodo`, `myCompleteTodo`, `myDeleteTodo` |
| Habits | `myCreateHabit`, `myUpdateHabit`, `myDeleteHabit`, `myCompleteHabit` |
| Time blocks | `myCreateTimeBlock`, `myUpdateTimeBlock`, `myDeleteTimeBlock` |
| Schedule | `myReschedule` (only mutation that **awaits** the writeback) |

### Public mutations (no auth)

`requestMagicLink(email)` → `RequestMagicLinkResult { ok, magicLink }`
`verifyMagicLink(token)` → `VerifyMagicLinkResult { token, userId }`

`PUBLIC_MUTATIONS` is a hard-coded set in `packages/server/src/schema/index.ts`; new public endpoints must be added there.

### Custom types

`ScheduledItem`, `StatsOverview`, `HabitStatSummary`, `TodoStatSummary`, `HabitDetail`, `HabitPeriod`, `ActivityTypeStats`, `HabitStats`, `UserProfile`, `RequestMagicLinkResult`, `VerifyMagicLinkResult`. See `extensionSDL` for the source-of-truth definitions.

### Field resolvers

`activityType` is field-resolved on `Habit` and `TimeBlock` via a per-request `DataLoader` (`context.loaders.activityType`) to prevent N+1.

`Todo.activityType` is resolved indirectly: the field-resolver loads the todo's `list` via `context.loaders.todoList`, then loads that list's activity type via the same `activityType` loader. `Todo.list` is provided by drizzle-graphql via the `todos → todoLists` relation.

---

## 5. Client Routes

| Path | File | Purpose |
|------|------|---------|
| `/` | `index.tsx` | Landing/redirect |
| `/login` | `login.tsx` | Magic-link request form |
| `/auth/verify` | `auth.verify.tsx` | Consumes magic-link token, stores JWT |
| `/onboarding` | `onboarding.tsx` | 4-step wizard (activity types → time blocks → habits → todos) |
| `/dashboard` | `dashboard.tsx` | Calendar + schedule sidebar |
| `/todos` | `todos.tsx` | Todo list |
| `/todo-lists` | `todo-lists.tsx` | Todo list CRUD (lists, not todos) |
| `/habits` | `habits.tsx` + `habits.index.tsx` | Habit list |
| `/habits/$habitId` | `habits.$habitId.tsx` | Habit detail (rates, periods) |
| `/time-blocks` | `time-blocks.tsx` | Time block CRUD |
| `/activity-types` | `activity-types.tsx` | Activity type CRUD |
| `/stats` | `stats.tsx` | Analytics surface (todo.md #9) |
| `/settings` | `settings.tsx` | iCal feed URL, re-run onboarding |

The auth guard lives in `__root.tsx` — redirects to `/login` without a token, `/onboarding` if `localStorage.onboarding_done` is unset.

---

## 6. Server Resolver Pipeline

```
Request
  → Apollo context: extract Bearer token → JWT verify → fall back to raw-UUID (dev-only) → set context.userId
  → Resolver entry
    → Guard: if (!context.userId) throw 'Not authenticated'
    → For mutations on existing rows: fetch row, check ownership, throw 'Forbidden' if mismatch
    → Zod validation: <Input>.parse(args.input)
    → Drizzle query
    → For mutations that affect schedule: runSchedulerWriteback(db, userId).catch(console.error)  // fire-and-forget (myReschedule is the only awaited one)
    → Return row; field resolvers (activityType) lazily load via DataLoader
```

Resolvers are split per-domain under `schema/resolvers/`. New domains follow the same pattern: SDL in `extensionSDL` (`schema/resolvers/index.ts`), `apply<Domain>Resolvers(queryFields, mutationFields)` in a sibling file, wired in `applyCustomResolvers`.

---

## 7. Tests

There are existing vitest suites — the project is not test-free:

- `packages/server/test/auth.test.ts` — magic-link token + JWT helpers
- `packages/server/test/schema/validators.test.ts` — Zod validator coverage
- `packages/server/test/services/scheduler.test.ts` — pure scheduler algorithm

Run with `npm test`. todo.md #15 ("test suite") covers the gaps that remain (resolver integration tests, CI workflow, coverage targets).

---

## 8. Generated Code

| Location | What | Regenerate |
|----------|------|------------|
| `packages/server/src/__generated__/schema.graphql` | Full SDL (drizzle-generated + extensions) | `npm run codegen:server` |
| `packages/server/src/__generated__/resolvers.ts` | Resolver types | `npm run codegen:server` |
| `packages/client/src/__generated__/gql.ts` + `graphql.ts` | Typed operations + result types | `npm run codegen` (requires server running on :4000) |

All `__generated__/` directories are gitignored.

---

## 9. Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Frontend + backend (concurrently) |
| `npm run dev:server` | API only on :4000 |
| `npm run dev:client` | Vite on :3000 |
| `npm run typecheck` | `tsc --noEmit` across packages |
| `npm run lint` / `lint:fix` | Biome |
| `npm test` | vitest |
| `npm run db:generate` | drizzle-kit generate (after schema changes) |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Drizzle Studio GUI |
| `npm run codegen` | Client GraphQL codegen (server must be up) |
| `npm run codegen:server` | Emit server SDL + resolver types |
| `npm run build` | codegen + Vite + tsc |
| `npm run build:docker` | `docker build -t auto-cal .` |
