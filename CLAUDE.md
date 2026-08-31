# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev
npm run dev              # frontend + backend concurrently
npm run dev:server       # GraphQL API only (localhost:3001)
npm run dev:client       # Expo dev server only (localhost:3000)

# Quality — run both before every commit; CI fails if either does not pass
npm test                 # vitest (all suites)
npm test -- server/test/services/scheduler.test.ts  # single file
npm test -- -t "schedules a todo"                           # single test by name
npm run test:coverage    # single run with coverage; fails below the thresholds in vitest.config.ts (this is what CI runs)
npm run lint             # biome check .
npm run lint:fix         # biome check --write .
npm run typecheck        # tsc --noEmit across all packages

# Database
npm run db:generate      # drizzle-kit generate (after schema changes)
npm run db:migrate       # apply pending migrations
npm run db:studio        # Drizzle Studio GUI

# GraphQL codegen
npm run generate:schema  # write src/__generated__/schema.graphql from Drizzle schema (no DB required — client is never connected)
npm run codegen:server   # regenerate server resolver types from schema.graphql
npm run codegen          # generate:schema → codegen:server → client typed operations

# Build / Docker
npm run build            # codegen + expo export --platform web + server tsc
npm run build:docker     # docker build -t auto-cal .
npm run build:android    # codegen + eas build -p android (see .agents/deployment.md)
```

Prefer these `package.json` scripts over ad-hoc `npx` invocations — they wrap env loading, workspace targeting, and flag conventions.

## Architecture

npm workspaces monorepo: `db` → `server` → `client`. No SST, no pnpm.

### `db`
Drizzle ORM schema over postgres.js. Exports a single `db` instance built from `DATABASE_URL`, and **throws at import time if that is unset** — Postgres is the only runtime backend. Types are always inferred (`$inferSelect` / `$inferInsert`) — never duplicated manually.

PGLite survives only as a *test* fixture: `server/test/**` constructs its own in-memory instances (`new PGlite('memory://')`) and never imports this module. It is a devDependency of `server`, not a dependency of `db`, so a production install cannot pull it in. It was dropped as a runtime backend because its WASM event loop busy-waits (see [`deployment.md`](.agents/deployment.md)), which made a deploy that lost its `DATABASE_URL` degrade silently instead of failing.

### `server`
Express + Apollo Server, running TypeScript directly via `--experimental-strip-types` (Node 22). **All imports must include `.ts` extension.** No build step.

**Schema pipeline** (three layers):
1. `buildSchema(db, buildSchemaConfig)` — `@vantreeseba/drizzle-graphql` (v9) auto-generates the full SDL from Drizzle tables. The config carries the tenant `scope`, the per-table `defaults` (ordering), the `exclude`d columns, and the disabled features
2. `scopeRootFields(schema)` — see below: renames the generated root queries to their `my*` form, guards them with `requireUser`, and deletes the rest
3. `applyCustomResolvers(schema)` — runs step 2, extends the result with custom SDL, wires the remaining resolvers, then ends with `finalizeSchema`: a `mapSchema` pass that asserts every surviving `Query` field is `my*`-prefixed, **removes** every `Mutation` field not starting with `my` (and not in `PUBLIC_MUTATIONS`), and `pruneSchema`s whatever that leaves unreferenced

**Scoping** lives in one place: `server/src/schema/scope.ts`, in two maps.

`TABLE_SCOPE` is the tenant boundary — for each Drizzle table, the predicate every generated read of it is confined to (`{ userId: { eq } }` for most; `users` scopes by `id` because the caller *is* the row; `apiKeys` also hides revoked keys; `habitCompletions` and `projectNotes` own no user column and scope through the relation to the parent that does). It is handed to `buildSchema` as `scope`, and the library ANDs it on **last, after the caller's `where`**, so a caller-supplied filter can only ever narrow it. It is per-*table* deliberately: a root-field wrapper only sees what passes through a root resolver, and a nested relation field never does.

`QUERY_SCOPE` maps each generated root query to the `my*` name it is served under and the table behind it. `scopeRootFields` rewraps the resolver already attached to the field, so the generated filtering, ordering, pagination, and relation loading stay intact — and the field still returns plain Drizzle rows, which the codegen `mappers` and the `FieldMap` resolvers both depend on. The wrapper adds only the `requireUser` guard, so an unauthenticated `myTodos` is one UNAUTHENTICATED error at the root.

Three invariants hold it up. A query whose table has no `TABLE_SCOPE` entry **throws at boot** rather than being served unscoped, and `assertEveryTableScoped` (called from `build-config.ts` over the real Drizzle schema) throws if any table lacks one at all. A generated field with no `QUERY_SCOPE` rule is **deleted**, not given a throwing resolver, so a query naming one fails validation rather than execution; it must also be listed in `UNEXPOSED`, so adding a Drizzle table throws at boot instead of quietly producing a hidden query. And because all of this happens inside `applyCustomResolvers`, `generate_schema.ts` and the resolver tests see exactly the surface the server serves. `server/test/schema/resolvers/scope.test.ts` pins the isolation behaviour across drizzle-graphql upgrades — negative-test any change to it by breaking one `TABLE_SCOPE` entry and confirming it fails.

Only queries that do real work beyond scoping are still hand-written: `myActivityTypeStats`, `myHabitStats`, `myHabitDetail`, `myStats`, `mySchedule`.

`PUBLIC_MUTATIONS` is a hard-coded `Set` in `server/src/schema/resolvers/index.ts`. Any new public endpoint must be added there.

**Generated mutations are off.** `server/src/schema/build-config.ts` disables `insert`/`update`/`updateMany`/`delete` (and both aggregate features). Every write goes through a hand-written `my*` resolver, so the generated mutations only ever existed to be stripped again — which also means `TABLE_SCOPE` is read-only in effect: hand-written resolvers enforce ownership with their own guard clauses. Generated *queries* have no such feature flag, which is why `scopeRootFields` handles them after the fact. With all four mutation features off, drizzle-graphql omits the `Mutation` type entirely — so `extensionSDL` **declares** `type Mutation` rather than extending it, and wires it as a root operation via `extend schema { mutation: Mutation }` (the same treatment `Subscription` needs, since `extendSchema` does not auto-promote conventionally-named types). Adding a mutation means adding a field to that declared block; there is no generated `Mutation` to extend.

**Relation fields:** every Drizzle-relation field on an object type gets a generated resolver — eager when the parent query pre-fetched it, request-batched lazy loading otherwise. Custom resolvers can return plain DB rows and relation fields resolve automatically. Explicit field resolvers — `FieldMap<'Todo', 'activityType'>` maps in the domain files, attached alongside the query/mutation maps — exist only for what the generated machinery can't do: derived hops (`Todo.activityType` via its list) and custom SDL fields (`Project.list`, `ActivityType.parent`/`children`). These use the per-request DataLoaders from context.

**Ordering is declared, not resolved.** `defaults` in `build-config.ts` gives each table its presentation order, and the library applies it to that table's own queries *and* to every to-many relation field targeting it — so a table reads the same way wherever it is reached from. Only a *missing* `orderBy` is replaced. In an entry, `priority` is the tiebreak rank and **the highest number sorts first**, not the key's position in the object. Do not hand-write a relation resolver to impose an order; add a default (`Project.notes` used to be exactly that override).

**Resolver authoring pattern** — every domain has its own file exporting plain
resolver maps typed against the codegen output:
```
schema/resolvers/
  index.ts         — extensionSDL string + attach()es every map to the schema
  types.ts         — QueryMap / MutationMap / SubscriptionMap / FieldMap helpers
  todos.ts         — todoQueries, todoMutations
  habits.ts        — habitQueries, habitMutations
  ...
```
```typescript
export const todoQueries: QueryMap<'myTodos'> = {
  myTodos: async (_parent, args, context) => { ... },
};
```
`QueryMap<K>` is `Required<Pick<QueryResolvers, K>>` from
`server/src/__generated__/resolvers.ts`, so `args` and the return value are
checked against the SDL — no hand-written `args: { id: string }` annotations,
no `!` assertions. A field name that isn't in the SDL is a compile error, and
`attach()` throws at startup if a resolver names a field the schema lacks.

The import in `types.ts` is type-only on purpose: `__generated__/resolvers.ts`
is generated *from* the SDL these files produce, so a value import would be a
bootstrap cycle. Node's type stripping erases it before that matters.

`codegen.server.ts` maps every table-backed GraphQL type to its Drizzle row
(`ActivityType: '@auto-cal/db#ActivityType as ActivityTypeRow'`, etc.) so
resolvers can return plain rows and let the generated relation resolvers fill
in the rest. It also sets `enumsAsTypes` — TS enums are nominal, so a resolver
could not return the plain `'created'` string it publishes.

New domains: add SDL to `extensionSDL` in `index.ts`, create a sibling file
exporting typed maps, and spread them into the `attach()` calls in
`applyCustomResolvers`.

**Scheduler — two separate things:**
- `computeSchedule(...)` in `services/scheduler.ts` — pure function, no DB. Recomputed fresh on every `mySchedule` query call.
- `runSchedulerWriteback(db, userId)` — writes `scheduledAt` back to the DB. Called fire-and-forget after every mutating resolver (`.catch(console.error)`, never awaited). The only exception is `myReschedule`, which awaits it deliberately. **Never await writeback in other resolvers.**

Since `todos.activityTypeId` does not exist on the DB row, callers of `computeSchedule` fetch `todoLists` alongside `todos`, build a `Map<listId, activityTypeId>`, and enrich each todo before passing it in.

**Auth chain** (in `server/src/index.ts`): Bearer JWT → API key (if `isApiKey(raw)` prefix check) → `BYPASS_AUTH_UUID` → raw-UUID fallback. The raw-UUID fallback is guarded by `NODE_ENV !== 'production'`. `BYPASS_AUTH_UUID` is **not** — setting it to a user id grants passwordless access to that account in any environment, production included. It logs a warning on boot; never set it on a deployed instance.

**API keys:** format `acal_<base64url>`. Only the SHA-256 hash is stored (`api_keys.keyHash`). Token is returned once on creation. `context.apiKey` is set when an API key is used; `myCreateApiKey` / `myRevokeApiKey` throw if `context.apiKey` is set (keys can't manage keys).

### `client`
Expo + expo-router (file-based) + React Native Web + Apollo Client. Routes live in `client/app/`, not `client/src/`; there is no `App.tsx` or `main.tsx` — `app/_layout.tsx` is the entry point and holds the `ApolloProvider`, the dark-mode effect, and the auth guard (redirects to `/auth/login` without a token). `app/(app)/_layout.tsx` holds the nav and the onboarding guard (redirects to `/onboarding` unless `onboarding_done` is set).

**One screen serves both platforms.** Every route is a single react-native file built from `components/ui/`; there are no `.native.tsx` screens and no `components/native/`. A `.tsx`/`.web.tsx` pair exists only for the few primitives whose web behaviour has no native equivalent (`input`, `icons`, `dialog`, `form-element`, `file-picker`, and the radix-backed ones) — both halves export the same names, so call sites never branch, and `client/test/platform-pairs.test.ts` pins that. Only the plain `.tsx` is typechecked against call sites, so run `npx expo export` for **both** `web` and `android` after touching a pair. Never touch `window`, `document`, `localStorage`, or `navigator` directly; use `client/src/storage.ts` (no-op off web) and `client/src/lib/clipboard.ts`.

GraphQL operations are colocated with the component that uses them. Fragments are defined in the leaf component and spread in the route-level query.

**Subscriptions are centralized.** `src/hooks/useLiveUpdates.ts` is the only subscriber, mounted once in `app/(app)/_layout.tsx`; it turns every server event into `src/lib/cache.ts` invalidation. Screens never call `useSubscription` or `refetch()` — and `refetchQueries` is banned for the same reason. See `.agents/client-patterns.md`.

## Key Conventions

**Guard clause order — auth → existence → ownership:**
```typescript
if (!context.userId) throw new Error('Not authenticated');
const todo = await context.db.query.todos.findFirst({ where: { id: args.id } });
if (!todo) throw new Error(`Todo ${args.id} not found`);
if (todo.userId !== context.userId) throw new Error('Forbidden');
```

**Zod validation at resolver boundary** — validators live in `schema/validators.ts`:
```typescript
const input = CreateTodoInput.parse(args.input);
```

**Enum pattern:**
```typescript
export const FREQUENCY_UNITS = ['week', 'month'] as const;
export type FrequencyUnit = (typeof FREQUENCY_UNITS)[number];
```

**Fire-and-forget writeback** — do not await outside `myReschedule`:
```typescript
runSchedulerWriteback(context.db, context.userId).catch(console.error);
return result;
```

## Generated Files

All `__generated__/` directories are gitignored and not committed. Run codegen before building or typechecking:

| File | Regenerated by |
|------|---------------|
| `server/src/__generated__/schema.graphql` | `npm run generate:schema` |
| `server/src/__generated__/resolvers.ts` | `npm run codegen:server` |
| `client/src/__generated__/graphql.ts` | `npm run codegen` |

`schema.graphql` is generated by running the schema module directly (which calls `applyCustomResolvers` and then `printSchema`), not by `codegen:server`. `codegen:server` reads the already-generated `schema.graphql` to emit resolver types.

**`keyHash` never reaches the schema.** `exclude.columns` in `build-config.ts` keeps the column out of everything derived from the column list at once — the `ApiKey` type, `ApiKeyFilters`, `ApiKeyOrderBy`, `ApiKeyDistinctColumn` — so there is nothing to strip after the fact. All four are reachable through the live `User.apiKeys` relation, and a filter or ordering on the hash is an oracle even when the field cannot be selected. The server still reads and writes the column through Drizzle directly (auth, ical-route, `myCreateApiKey`); this is a GraphQL-surface rule. It logs a build-time warning about generated inserts, which does not apply because `features.insert` is off.

**Runtime schema patches** are applied in `applyCustomResolvers` and therefore reflected in `schema.graphql` when regenerated.

## Agent Reference Files

Detailed patterns and decisions live in `.agents/`:

- [`.agents/db-patterns.md`](.agents/db-patterns.md) — Drizzle table definitions, connection, query patterns, migrations
- [`.agents/server-patterns.md`](.agents/server-patterns.md) — Full resolver authoring guide, Zod constraint table, auth details, DataLoader usage, iCal endpoint
- [`.agents/graphql-patterns.md`](.agents/graphql-patterns.md) — Full SDL, naming conventions, cache invalidation
- [`.agents/client-patterns.md`](.agents/client-patterns.md) — Apollo Client setup, expo-router, cache invalidation, fragment colocation, ShadCN/Tailwind patterns
- [`.agents/scheduling.md`](.agents/scheduling.md) — Scheduling algorithm, writeback service, habit instance generation, pre-placement lock
- [`.agents/deployment.md`](.agents/deployment.md) — Docker, environment variables, Postgres setup
- [`.agents/project-structure.md`](.agents/project-structure.md) — Full directory tree, DB schema columns, route table, GraphQL operation index

Open work is tracked in GitHub issues (`gh issue list`), not in a file — read the
`v1` milestone before starting new features. Agent-created *planning* documents
(design notes for a specific feature, like `plan-caldav.md`) still live in
`.agents/`, not at the repo root.
