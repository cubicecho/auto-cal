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
npm run lint             # biome check .
npm run lint:fix         # biome check --write .
npm run typecheck        # tsc --noEmit across all packages

# Database
npm run db:generate      # drizzle-kit generate (after schema changes)
npm run db:migrate       # apply pending migrations
npm run db:studio        # Drizzle Studio GUI

# GraphQL codegen
npm run generate:schema  # write src/__generated__/schema.graphql from Drizzle schema (no DB required — uses in-memory PGlite)
npm run codegen:server   # regenerate server resolver types from schema.graphql
npm run codegen          # generate:schema → codegen:server → client typed operations

# Build / Docker
npm run build            # codegen + expo export --platform web + server tsc
npm run build:docker     # docker build -t auto-cal .
```

Prefer these `package.json` scripts over ad-hoc `npx` invocations — they wrap env loading, workspace targeting, and flag conventions.

## Architecture

npm workspaces monorepo: `db` → `server` → `client`. No SST, no pnpm.

### `db`
Drizzle ORM schema + PGLite/Postgres dual-backend. Exports a single `db` instance; picks the backend from env: `DATABASE_URL` → postgres.js, `PGLITE_DATA_DIR` → PGLite. Types are always inferred (`$inferSelect` / `$inferInsert`) — never duplicated manually.

### `server`
Express + Apollo Server, running TypeScript directly via `--experimental-strip-types` (Node 22). **All imports must include `.ts` extension.** No build step.

**Schema pipeline** (two layers):
1. `buildSchema(db, ...)` — `@vantreeseba/drizzle-graphql` auto-generates the full SDL from Drizzle tables
2. `applyCustomResolvers(schema)` — extends the schema with custom SDL, wires all resolvers, then ends with `finalizeSchema`: a `mapSchema` pass that **removes** every `Query`/`Mutation` field not starting with `my` (and not in `PUBLIC_MUTATIONS`), strips the `keyHash` input surfaces, and `pruneSchema`s whatever that leaves unreferenced

Unscoped fields are deleted, not given a throwing resolver, so they never reach introspection or client codegen — a query naming one fails validation rather than execution. Because the removal happens inside `applyCustomResolvers`, `generate_schema.ts` and the resolver tests see exactly the surface the server serves.

`PUBLIC_MUTATIONS` is a hard-coded `Set` in `server/src/schema/resolvers/index.ts`. Any new public endpoint must be added there.

**Generated mutations are off.** `server/src/schema/build-config.ts` disables `insert`/`update`/`updateMany`/`delete` (and both aggregate features). Every write goes through a hand-written `my*` resolver, so the generated mutations only ever existed to be stripped again. Generated *queries* have no such feature flag, which is why `finalizeSchema` removes them after the fact. With all four mutation features off, drizzle-graphql omits the `Mutation` type entirely — so `extensionSDL` **declares** `type Mutation` rather than extending it, and wires it as a root operation via `extend schema { mutation: Mutation }` (the same treatment `Subscription` needs, since `extendSchema` does not auto-promote conventionally-named types). Adding a mutation means adding a field to that declared block; there is no generated `Mutation` to extend.

**Relation fields (drizzle-graphql v4):** every Drizzle-relation field on an object type gets a generated resolver — eager when the parent query pre-fetched it, request-batched lazy loading otherwise. Custom resolvers can return plain DB rows and relation fields resolve automatically. Explicit field resolvers — `FieldMap<'Todo', 'activityType'>` maps in the domain files, attached alongside the query/mutation maps — exist only for what the generated machinery can't do: derived hops (`Todo.activityType` via its list), custom SDL fields (`Project.list`, `ActivityType.parent`/`children`), and `Project.notes`, which overrides the generated resolver to enforce position ordering. These use the per-request DataLoaders from context.

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

Web and native diverge by file extension: `todo-lists.tsx` is the web screen, `todo-lists.native.tsx` the native one. Metro picks the `.native` variant on iOS/Android and the plain one on web — a change to a screen usually needs to land in both. Never touch `window` or `localStorage` directly; use `client/src/storage.ts`, which is a no-op off web.

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

**Runtime schema patches** are applied in `applyCustomResolvers` and therefore reflected in `schema.graphql` when regenerated. The one in place today removes `keyHash` everywhere: the field is deleted from the `ApiKey` type so the stored token hash can never be selected, and `stripKeyHash` (a `mapSchema` pass that must run last, since it rebuilds the schema) drops it from the generated `ApiKeyFilters`, `ApiKeyOrderBy`, and `ApiKeyDistinctColumn` inputs, which would otherwise let a caller filter or sort on the hash without selecting it.

## Agent Reference Files

Detailed patterns and decisions live in `.agents/`:

- [`.agents/db-patterns.md`](.agents/db-patterns.md) — Drizzle table definitions, dual-backend connection, query patterns, migrations
- [`.agents/server-patterns.md`](.agents/server-patterns.md) — Full resolver authoring guide, Zod constraint table, auth details, DataLoader usage, iCal endpoint
- [`.agents/graphql-patterns.md`](.agents/graphql-patterns.md) — Full SDL, naming conventions, cache invalidation
- [`.agents/client-patterns.md`](.agents/client-patterns.md) — Apollo Client setup, expo-router, cache invalidation, fragment colocation, ShadCN/Tailwind patterns
- [`.agents/scheduling.md`](.agents/scheduling.md) — Scheduling algorithm, writeback service, habit instance generation, pre-placement lock
- [`.agents/deployment.md`](.agents/deployment.md) — Docker, environment variables, PGLite vs Postgres
- [`.agents/todo.md`](.agents/todo.md) — Open issues and deferred work (read before starting new features)
- [`.agents/project-structure.md`](.agents/project-structure.md) — Full directory tree, DB schema columns, route table, GraphQL operation index

All agent-created planning and tracking files must live in `.agents/`, not at the repo root.
