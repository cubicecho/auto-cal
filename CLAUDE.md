# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev
npm run dev              # frontend + backend concurrently
npm run dev:server       # GraphQL API only (localhost:4000)
npm run dev:client       # Vite client only (localhost:3000)

# Quality — run both before every commit; CI fails if either does not pass
npm test                 # vitest (all suites)
npm test -- packages/server/src/services/scheduler.test.ts  # single file
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
npm run build            # codegen + vite + tsc
npm run build:docker     # docker build -t auto-cal .
```

Prefer these `package.json` scripts over ad-hoc `npx` invocations — they wrap env loading, workspace targeting, and flag conventions.

## Architecture

npm workspaces monorepo: `packages/db` → `packages/server` → `packages/client`. No SST, no pnpm.

### `packages/db`
Drizzle ORM schema + PGLite/Postgres dual-backend. Exports a single `db` instance; picks the backend from env: `DATABASE_URL` → postgres.js, `PGLITE_DATA_DIR` → PGLite. Types are always inferred (`$inferSelect` / `$inferInsert`) — never duplicated manually.

### `packages/server`
Express + Apollo Server, running TypeScript directly via `--experimental-strip-types` (Node 22). **All imports must include `.ts` extension.** No build step.

**Schema pipeline** (three layers):
1. `buildSchema(db, ...)` — `@vantreeseba/drizzle-graphql` auto-generates the full SDL from Drizzle tables
2. `applyCustomResolvers(schema)` — extends the schema with custom SDL and wires all resolvers
3. `blockUnscopedResolvers(schema)` — replaces every `Query`/`Mutation` field that doesn't start with `my` (or isn't in `PUBLIC_MUTATIONS`) with a resolver that throws

`PUBLIC_MUTATIONS` is a hard-coded `Set` in `packages/server/src/schema/index.ts`. Any new public endpoint must be added there.

**drizzle-graphql limitation:** the package only attaches resolvers to top-level `Query`/`Mutation` fields — relation fields on object types (e.g. `Todo.list`, `Todo.activityType`) are left without resolvers. When a custom resolver returns a plain DB row, any relation field the client requests will be `null` unless you add an explicit field resolver. See `applyCustomResolvers` in `schema/resolvers/index.ts` for the existing examples (`Todo.list`, `Todo.activityType`, `Habit.activityType`, `TimeBlock.activityType`). All use the per-request DataLoaders from context.

**Resolver authoring pattern** — every domain has its own file:
```
schema/resolvers/
  index.ts         — extensionSDL string + wires all apply* calls
  todos.ts         — applyTodoResolvers(queryFields, mutationFields)
  habits.ts        — applyHabitResolvers(...)
  ...
```
New domains: add SDL to `extensionSDL` in `index.ts`, create a sibling file, call it from `applyCustomResolvers`.

**Scheduler — two separate things:**
- `computeSchedule(...)` in `services/scheduler.ts` — pure function, no DB. Recomputed fresh on every `mySchedule` query call.
- `runSchedulerWriteback(db, userId)` — writes `scheduledAt` back to the DB. Called fire-and-forget after every mutating resolver (`.catch(console.error)`, never awaited). The only exception is `myReschedule`, which awaits it deliberately. **Never await writeback in other resolvers.**

Since `todos.activityTypeId` does not exist on the DB row, callers of `computeSchedule` fetch `todoLists` alongside `todos`, build a `Map<listId, activityTypeId>`, and enrich each todo before passing it in.

**Auth chain** (in `packages/server/src/index.ts`): Bearer JWT → API key (if `isApiKey(raw)` prefix check) → raw-UUID fallback. The UUID fallback is currently active in **all** environments (not prod-guarded) — tracked as a known issue in `.agents/todo.md` #25.

**API keys:** format `acal_<base64url>`. Only the SHA-256 hash is stored (`api_keys.keyHash`). Token is returned once on creation. `context.apiKey` is set when an API key is used; `myCreateApiKey` / `myRevokeApiKey` throw if `context.apiKey` is set (keys can't manage keys).

### `packages/client`
React + Vite + Apollo Client + TanStack Router (file-based). Auth guard in `__root.tsx` redirects to `/login` (no token) or `/onboarding` (no `localStorage.onboarding_done`). There is no `App.tsx` — providers live in `main.tsx`.

GraphQL operations are colocated with the component that uses them. Fragments are defined in the leaf component and spread in the route-level query.

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

## Generated Files (gitignored but tracked)

All `__generated__/` directories are in `.gitignore` but are committed. Use `git add -f` after regenerating:

| File | Regenerated by |
|------|---------------|
| `packages/server/src/__generated__/schema.graphql` | `npm run generate:schema` |
| `packages/server/src/__generated__/resolvers.ts` | `npm run codegen:server` |
| `packages/client/src/__generated__/graphql.ts` | `npm run codegen` |

`schema.graphql` is generated by running the schema module directly (which calls `applyCustomResolvers` and then `printSchema`), not by `codegen:server`. `codegen:server` reads the already-generated `schema.graphql` to emit resolver types.

**Runtime schema patches** are applied in `applyCustomResolvers` and therefore reflected in `schema.graphql` when regenerated. Example: `ApiKey.scopes` is patched from `String!` to `[String!]!` to correct drizzle-graphql's handling of the `text[].array()` column.

## Agent Reference Files

Detailed patterns and decisions live in `.agents/`:

- [`.agents/db-patterns.md`](.agents/db-patterns.md) — Drizzle table definitions, dual-backend connection, query patterns, migrations
- [`.agents/server-patterns.md`](.agents/server-patterns.md) — Full resolver authoring guide, Zod constraint table, auth details, DataLoader usage, iCal endpoint
- [`.agents/graphql-patterns.md`](.agents/graphql-patterns.md) — Full SDL, naming conventions, cache invalidation
- [`.agents/client-patterns.md`](.agents/client-patterns.md) — Apollo Client setup, TanStack Router/Form, fragment colocation, ShadCN/Tailwind patterns
- [`.agents/scheduling.md`](.agents/scheduling.md) — Scheduling algorithm, writeback service, habit instance generation, pre-placement lock
- [`.agents/deployment.md`](.agents/deployment.md) — Docker, environment variables, PGLite vs Postgres
- [`.agents/todo.md`](.agents/todo.md) — Open issues and deferred work (read before starting new features)
- [`.agents/project-structure.md`](.agents/project-structure.md) — Full directory tree, DB schema columns, route table, GraphQL operation index

All agent-created planning and tracking files must live in `.agents/`, not at the repo root.
