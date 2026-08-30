# Project Structure — Auto Cal

> Index/overview. For deeper dives see the sibling `.agents/` files: `db-patterns.md`, `server-patterns.md`, `graphql-patterns.md`, `client-patterns.md`, `scheduling.md`, `deployment.md`.

## 1. Overview

Auto Cal is a smart todo + habit scheduling app. Users create **todo lists** (grouped by activity type), **todos** (one-shot tasks that belong to a list), and **habits** (repeated targets), which the scheduler places into user-defined **time blocks** by priority and activity type. Stats track habit consistency and todo throughput per activity type.

The repo is a **npm workspace** monorepo (`workspaces: ["client", "db", "server"]` in the root `package.json`). The three workspace folders live at the repo root, alongside the `site/` folder. There is no `pnpm-workspace.yaml` and no `sst.config.ts`.

| Package | Role |
|---------|------|
| `db/` | Drizzle ORM schema, Postgres connection, seed + migration runners |
| `server/` | Node 22 GraphQL API (Express + Apollo) — runs `.ts` directly via `--experimental-strip-types` |
| `client/` | Expo + expo-router + React Native Web + Apollo Client + ShadCN/NativeWind |

Key tech choices: **Biome** (lint+format), `@vantreeseba/drizzle-graphql` (auto-generates GraphQL schema from Drizzle tables — feature-fork of upstream), **PostgreSQL** (the only runtime backend, via `DATABASE_URL`; PGLite is test-only), **vitest** for tests.

---

## 2. Package Layout

### `db/`

```
db/src/
├── index.ts            # Postgres connection + migrations, exports `db` instance
├── schema.ts           # Aggregates all model exports
├── relations.ts        # Drizzle relations
├── migrator.ts         # Programmatic drizzle-kit migrate (used by Dockerfile)
└── models/
    ├── enums.ts            # ACTIVITY_TYPES, FREQUENCY_UNITS, etc.
    ├── index.ts            # Re-exports all models
    ├── users.ts
    ├── activity_types.ts     # self-FK tree via nullable parentId
    ├── todo_lists.ts
    ├── todos.ts
    ├── habits.ts
    ├── time_blocks.ts
    ├── habit_completions.ts
    ├── projects.ts
    ├── project_notes.ts
    └── api_keys.ts

db/drizzle/         # Generated migrations — never edit manually
```

### `server/`

```
server/src/
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
│   ├── index.ts              # buildSchema → applyCustomResolvers
│   ├── build-config.ts       # shared buildSchema config (CRUD mutations off)
│   ├── scope.ts              # QUERY_SCOPE / UNEXPOSED + scopeRootFields
│   ├── validators.ts         # Zod validators for resolver inputs
│   ├── validators.test.ts
│   └── resolvers/
│       ├── index.ts          # extensionSDL + attach()es the typed maps
│       ├── types.ts          # QueryMap / MutationMap / SubscriptionMap / FieldMap
│       ├── todo-lists.ts
│       ├── todos.ts
│       ├── habits.ts
│       ├── time-blocks.ts
│       ├── activity-types.ts
│       ├── projects.ts
│       ├── api-keys.ts
│       ├── schedule.ts
│       ├── stats.ts
│       ├── profile.ts
│       ├── subscriptions.ts
│       ├── import.ts         # myImportTodos — bulk Google Tasks import (transactional)
│       └── auth.ts
└── __generated__/            # Server schema + resolver types (codegen output)
    ├── schema.graphql
    └── resolvers.ts
```

Imports **must** include `.ts` extension (Node 22 `--experimental-strip-types`).

### `client/`

Routes live in `client/app/` (expo-router owns that directory); everything else
lives in `client/src/` and is reached through the `@/` alias.

```
client/app/                  # File-based routes (expo-router)
├── _layout.tsx              # Entry — ApolloProvider, dark mode, auth guard
├── auth/
│   ├── login.tsx            # /auth/login
│   └── verify.tsx           # /auth/verify
└── (app)/                   # Route group — authenticated screens, no URL segment
    ├── _layout.tsx          # Nav (web) / tabs (native) + onboarding guard
    ├── index.tsx            # /
    ├── onboarding.tsx
    ├── today.tsx
    ├── calendar.tsx
    ├── stats.tsx
    ├── import-todos.tsx     # Google Tasks JSON import
    ├── todo-lists.tsx       + todo-lists.native.tsx
    ├── time-blocks.tsx      + time-blocks.native.tsx
    ├── activity-types.tsx   + activity-types.native.tsx
    ├── settings.tsx         + settings.native.tsx
    ├── habits/              + habits.native.tsx
    │   ├── _layout.tsx
    │   ├── index.tsx        # /habits
    │   └── [habitId].tsx    # /habits/:habitId
    └── projects/            + projects.native.tsx
        ├── _layout.tsx
        ├── index.tsx        # /projects
        └── [projectId].tsx  # /projects/:projectId

client/src/
├── apollo-client.ts      # The single ApolloClient — link split, typePolicies
├── storage.ts            # Key-value store; no-ops off web (never touch localStorage)
├── lib/cache.ts          # Cache invalidation helpers (replaces refetchQueries)
├── lib/utils.ts          # cn(), priorityLabel()
├── lib/google-tasks.ts   # parseGoogleTasks() — Takeout Tasks.json parser
├── hooks/                # form-hook, useLiveUpdates, useListSection, …
├── components/
│   ├── ui/               # ShadCN primitives + custom (route-error, page, …)
│   └── domain/
│       ├── activity-type/
│       ├── todo/
│       ├── todo-list/
│       ├── habit/
│       ├── project/
│       ├── time-block/
│       ├── dashboard/
│       ├── settings/
│       └── onboarding/
└── __generated__/        # GraphQL Codegen output (gitignored)
    ├── gql.ts
    └── graphql.ts
```

There is no `App.tsx` and no `main.tsx` — `app/_layout.tsx` is the entry point.

A screen with a `.native.tsx` sibling exists twice: Metro resolves `.native`
first on iOS/Android and ignores it on web. Changing one usually means changing
both.

---

## 3. Database Schema

Full column definitions live in `db/src/models/`. Summary:

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
| parentId | uuid | nullable self-FK → activity_types (`set null`). Makes activity types a tree; a project's dedicated type is a child of a parent. |
| createdAt / updatedAt | timestamp | |

**`todo_lists`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK users (cascade delete) |
| name | text | notNull |
| description | text | nullable |
| activityTypeId | uuid | FK activity_types (restrict) — notNull |
| projectId | uuid | nullable FK projects (`set null`) — set when the list belongs to a project, else standalone |
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

**`projects`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK users (cascade delete) |
| name | text | notNull |
| status | text | notNull, default `'active'`, `'active' \| 'completed' \| 'archived'` (typed via `$type<ProjectStatus>`) |
| activityTypeId | uuid | FK activity_types (restrict) — notNull. The project's **dedicated** activity type (a child under a parent), auto-created with the project. |
| createdAt / updatedAt | timestamp | |

**`project_notes`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK users (cascade delete) |
| projectId | uuid | FK projects (cascade delete) |
| title | text | notNull |
| content | text | notNull, default `''` (markdown) |
| position | integer | notNull, default 0 — manual ordering |
| createdAt / updatedAt | timestamp | |

Conventions: all PKs use `uuid`+`defaultRandom`; user-owned tables cascade-delete; required references to activity-type / list use `onDelete: 'restrict'`; timestamps are `timestamp` (not `timestamptz`). Types are inferred via `$inferSelect` / `$inferInsert` — never duplicated.

---

## 4. GraphQL Schema (high level)

The base schema is auto-generated from Drizzle by `@vantreeseba/drizzle-graphql`, then narrowed by `scopeRootFields()` (which renames the generated root queries to their `my*` form, guards them with `requireUser`, and deletes the rest — the row scope itself is `TABLE_SCOPE`, handed to `buildSchema` in `build-config.ts`), extended in `server/src/schema/resolvers/index.ts` (`extensionSDL`), and locked down by `finalizeSchema()` (the last step of `applyCustomResolvers`), which removes every mutation that is not `my*` or in `PUBLIC_MUTATIONS` so only those appear in the SDL at all. Full SDL details in `graphql-patterns.md` and `server-patterns.md`.

### Queries (`my*` scoped)

Nine come from `QUERY_SCOPE` in `server/src/schema/scope.ts` — generated resolvers, renamed and scoped, taking the generated `where` / `orderBy` / `limit` / `offset` / `after` / `distinct` arguments:

| Query | Notes |
|-------|-------|
| `myProfile` | Single `User` (id, email, timezone); scoped by `id`, not `userId` |
| `myActivityTypes` | Default order: name asc |
| `myTodoLists` | Default order: name asc |
| `myTodos` | Default order: priority desc, createdAt desc |
| `myHabits` | Default order: priority desc, createdAt desc |
| `myTimeBlocks` | Default order: startTime asc |
| `myProjects` | Default order: createdAt desc; pass `where: { status: { ne: "archived" } }` to hide archived |
| `myProject` | Single `Project`; `null` for a foreign or missing id, never `FORBIDDEN` |
| `myApiKeys` | Revoked keys are excluded by the scope itself |

Five are hand-written because they compute rather than filter:

| Query | Notes |
|-------|-------|
| `mySchedule(weekStart, timezone)` | Live-recomputed schedule for the week (see `scheduling.md`) |
| `myStats(startDate, endDate)` | Composite + per-habit + todo summary |
| `myHabitDetail(habitId, periods)` | Per-period rates for a habit |
| `myActivityTypeStats(startDate, endDate)` | |
| `myHabitStats(habitId, startDate, endDate)` | |

### Mutations (`my*` scoped)

| Domain | Mutations |
|--------|-----------|
| Profile | `myUpdateProfile` |
| Activity types | `myCreateActivityType`, `myUpdateActivityType`, `myDeleteActivityType` |
| Todo lists | `myCreateTodoList`, `myUpdateTodoList`, `myDeleteTodoList` |
| Todos | `myCreateTodo`, `myUpdateTodo`, `myCompleteTodo`, `myDeleteTodo`, `myDeleteTodos` |
| Habits | `myCreateHabit`, `myUpdateHabit`, `myDeleteHabit`, `myCompleteHabit`, `myUncompleteHabit` |
| Time blocks | `myCreateTimeBlock`, `myUpdateTimeBlock`, `myDeleteTimeBlock` |
| Projects | `myCreateProject`, `myUpdateProject`, `myArchiveProject` |
| Project notes | `myCreateProjectNote`, `myUpdateProjectNote`, `myReorderProjectNotes`, `myDeleteProjectNote` |
| API keys | `myCreateApiKey`, `myRevokeApiKey` (both throw when called *with* an API key) |
| Import | `myImportTodos` |
| Schedule | `myReschedule` (only mutation that **awaits** the writeback) |

### Public mutations (no auth)

`requestMagicLink(email)` → `RequestMagicLinkResult { ok, magicLink }`
`verifyMagicLink(token)` → `VerifyMagicLinkResult { token, userId }`

`PUBLIC_MUTATIONS` is a hard-coded set in `server/src/schema/resolvers/index.ts`; new public endpoints must be added there.

### Custom types

`ScheduledItem`, `StatsOverview`, `HabitStatSummary`, `TodoStatSummary`, `HabitDetail`, `HabitPeriod`, `ActivityTypeStats`, `HabitStats`, `RequestMagicLinkResult`, `VerifyMagicLinkResult`. See `extensionSDL` for the source-of-truth definitions.

### Field resolvers

`activityType` is field-resolved on `Habit` and `TimeBlock` via a per-request `DataLoader` (`context.loaders.activityType`) to prevent N+1.

`Todo.activityType` is resolved indirectly: the field-resolver loads the todo's `list` via `context.loaders.todoList`, then loads that list's activity type via the same `activityType` loader. `Todo.list` is provided by drizzle-graphql via the `todos → todoLists` relation.

---

## 5. Client Routes

All paths are relative to `client/app/`. `✕` marks a screen with a
`.native.tsx` sibling that has to be kept in step.

| Path | File | Native | Purpose |
|------|------|--------|---------|
| `/auth/login` | `auth/login.tsx` | | Magic-link request form |
| `/auth/verify` | `auth/verify.tsx` | | Consumes magic-link token, stores JWT |
| `/` | `(app)/index.tsx` | | Landing/redirect |
| `/onboarding` | `(app)/onboarding.tsx` | | 4-step wizard (activity types → time blocks → habits → todos) |
| `/today` | `(app)/today.tsx` | | Today's schedule + quick complete |
| `/calendar` | `(app)/calendar.tsx` | | Week calendar + schedule sidebar |
| `/todo-lists` | `(app)/todo-lists.tsx` | ✕ | Lists and their todos |
| `/projects` | `(app)/projects/index.tsx` | ✕ | Project list |
| `/projects/:projectId` | `(app)/projects/[projectId].tsx` | ✕ | Project detail + notes |
| `/habits` | `(app)/habits/index.tsx` | ✕ | Habit list |
| `/habits/:habitId` | `(app)/habits/[habitId].tsx` | ✕ | Habit detail (rates, periods) |
| `/time-blocks` | `(app)/time-blocks.tsx` | ✕ | Time block CRUD |
| `/activity-types` | `(app)/activity-types.tsx` | ✕ | Activity type CRUD |
| `/stats` | `(app)/stats.tsx` | | Analytics surface |
| `/import-todos` | `(app)/import-todos.tsx` | | Google Tasks JSON import |
| `/settings` | `(app)/settings.tsx` | ✕ | iCal feed URL, API keys, re-run onboarding |

The auth guard lives in `app/_layout.tsx` — redirects to `/auth/login` without a token. The onboarding guard lives in `app/(app)/_layout.tsx` — redirects to `/onboarding` if `onboarding_done` is unset.

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

Resolvers are split per-domain under `schema/resolvers/`. New domains follow the same pattern: SDL in `extensionSDL` (`schema/resolvers/index.ts`), `<domain>Queries` / `<domain>Mutations` maps typed with `QueryMap`/`MutationMap` in a sibling file, spread into the `attach()` calls in `applyCustomResolvers`.

---

## 7. Tests

There are existing vitest suites — the project is not test-free:

- `server/test/auth.test.ts` — magic-link token + JWT helpers
- `server/test/schema/validators.test.ts` — Zod validator coverage
- `server/test/services/scheduler.test.ts` — pure scheduler algorithm

Run with `npm test`; CI runs the same suites on every PR via `.github/workflows/ci.yml`.
Client smoke tests and coverage thresholds are the remaining gap —
[cubicecho/auto-cal#57](https://github.com/cubicecho/auto-cal/issues/57).

---

## 8. Generated Code

| Location | What | Regenerate |
|----------|------|------------|
| `server/src/__generated__/schema.graphql` | Full SDL (drizzle-generated + extensions) | `npm run codegen:server` |
| `server/src/__generated__/resolvers.ts` | Resolver types | `npm run codegen:server` |
| `client/src/__generated__/gql.ts` + `graphql.ts` | Typed operations + result types | `npm run codegen` (requires server running on :3001) |

All `__generated__/` directories are gitignored.

---

## 9. Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Frontend + backend (concurrently) |
| `npm run dev:server` | API only on :3001 |
| `npm run dev:client` | Expo dev server on :3000 |
| `npm run typecheck` | `tsc --noEmit` across packages |
| `npm run lint` / `lint:fix` | Biome |
| `npm test` | vitest |
| `npm run db:generate` | drizzle-kit generate (after schema changes) |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Drizzle Studio GUI |
| `npm run codegen` | Client GraphQL codegen (server must be up) |
| `npm run codegen:server` | Emit server SDL + resolver types |
| `npm run build` | codegen + `expo export --platform web` + server tsc |
| `npm run build:docker` | `docker build -t auto-cal .` |
