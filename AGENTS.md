# Project: Auto Cal

Auto Cal is a smart todo and habit scheduling application. Users create todo lists (grouped by activity type), todos (single-time tasks belonging to a list), and habits (repeated tasks) that are automatically scheduled within user-defined time blocks based on priority and activity type.

Monorepo: `packages/db` (Drizzle + PGLite), `packages/server` (Express + Apollo), `packages/client` (React + Vite).

## Commands

```bash
# Dev
npm run dev              # start frontend + backend
npm run dev:server       # GraphQL server only (localhost:3001)
npm run dev:client       # React client only (localhost:3000)

# Quality
npm run typecheck        # tsc --noEmit across all packages
npm run lint             # biome check .
npm run lint:fix         # biome check --write .

# Database
npm run db:generate      # drizzle-kit generate (after schema changes)
npm run db:migrate       # drizzle-kit migrate
npm run db:studio        # Drizzle Studio GUI

# GraphQL
npm run codegen          # runs codegen:server then codegen:client
npm run codegen:server   # server resolver types (reads schema.graphql)
npm run codegen:client   # client typed operations (reads schema.graphql)

# Build
npm run build            # codegen + vite + tsc (run before docker build)
npm run build:docker     # docker build -t auto-cal .
npm test                 # vitest
```

**Before every commit:** run `npm test` and `npm run lint`. CI will fail if either does not pass.

## Tech Stack

| Choice | Why |
|--------|-----|
| **Biome** | Single tool replacing ESLint + Prettier; enforces `useImportType`, `noUnusedImports`, consistent formatting |
| **drizzle-graphql** | Auto-generates GraphQL schema from Drizzle tables — zero duplication; we extend with custom resolvers |
| **PGLite** | Embedded Postgres, zero setup for local dev and single-node deploys; swap to full Postgres via `DATABASE_URL` |
| **--experimental-strip-types** | Node 22+ runs TypeScript directly — no tsc watch, no build step for the server; requires `.ts` extensions in all imports |
| **Auth** | Magic-link + JWT (jose) is live. `requestMagicLink` / `verifyMagicLink` mutations are public. Set `EXPOSE_MAGIC_LINK` for dev-style passwordless login on local/secure networks. |

## Key Conventions

**Type inference — never duplicate types manually:**
```typescript
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
```

**Enum pattern:**
```typescript
export const FREQUENCY_UNITS = ['week', 'month'] as const;
export type FrequencyUnit = (typeof FREQUENCY_UNITS)[number];
```

**Guard clause order — auth → existence → ownership:**
```typescript
if (!context.userId) throw new Error('Not authenticated');
const todo = await context.db.query.todos.findFirst({ where: eq(todos.id, id) });
if (!todo) throw new Error(`Todo ${id} not found`);
if (todo.userId !== context.userId) throw new Error('Forbidden');
```

**Zod validation at resolver boundary:**
```typescript
const input = CreateTodoInput.parse(args.input); // throws ZodError if invalid
```

**Never swallow errors:**
```typescript
try {
  await someOperation();
} catch (cause) {
  throw new Error('Failed to complete operation', { cause });
}
```

**GraphQL operations in the client must use the typed `graphql()` helper — never raw `gql`:**
```typescript
// ✅ correct
import { graphql } from '@/__generated__/index.js';
const MY_QUERY = graphql(`query Foo { ... }`);

// ❌ wrong — loses type safety
import { gql } from '@apollo/client';
const MY_QUERY = gql`query Foo { ... }`;
```
After adding or changing any operation, re-run `npm run codegen` to regenerate types.
The generated files in `__generated__/` are gitignored — do not commit them.

## Finding files, text or other code. 

Prefer using an LSP and finding definitions, references, etc through it instead of using grep.
You can scan the project to detect what LSP makes the most sense to start with.

## Running Commands

Prefer scripts defined in `package.json` (e.g. `npm run db:generate`, `npm run typecheck`) over ad-hoc tool invocations (`npx drizzle-kit ...`, `npx tsc ...`). The scripts wrap env loading, workspace targeting, and flag conventions — bypassing them tends to break on env vars or surface different errors than the rest of the team sees.

## Agent File Convention

All files related to project structure, tasks, planning, and feature tracking live in `.agents/`. Agents must read from and write to `.agents/` for any such files — never create them at the repo root.

Always add new `.agents/` files to the reference list below.

## Keep the Website in Sync

The marketing/docs site lives in `site/` (Eleventy → GitHub Pages, published at
`https://cubicecho.github.io/auto-cal/`). When you complete a user-facing
feature, change, or remove functionality, update the site in the same change so
it never falls behind the app:

- **New or changed features** — update the feature descriptions in `site/src/index.njk` (and the hero example if the scheduling/day view changed).
- **Self-hosting changes** — new env vars, ports, Docker options, or setup steps go in `site/src/self-hosting.njk` (keep it consistent with `README.md`).
- **Renamed/removed views or flows** — fix any references so screenshots, copy, and examples match what ships.

Preview locally with `npm run dev` inside `site/` (serves on `localhost:8080`);
the GitHub Pages workflow (`.github/workflows/pages.yml`) deploys on push to `main`.

## Agent Reference Files

- [`.agents/project-structure.md`](.agents/project-structure.md) — Full package layout, DB schema tables, GraphQL operations, client components, resolver pipeline, directory tree
- [`.agents/db-patterns.md`](.agents/db-patterns.md) — Drizzle table definitions, type inference, query/insert/update/delete patterns, dual-backend connection, migrations
- [`.agents/server-patterns.md`](.agents/server-patterns.md) — GraphQL schema pipeline, resolver authoring, guard clauses, Zod validation, JWT auth, DataLoader usage
- [`.agents/graphql-patterns.md`](.agents/graphql-patterns.md) — Schema extension SDL, core/custom types, key queries and mutations, naming conventions, cache invalidation
- [`.agents/client-patterns.md`](.agents/client-patterns.md) — Apollo Client setup, TanStack Router, colocated operations, fragment colocation, TanStack Form, ShadCN/Tailwind component patterns, codegen
- [`.agents/scheduling.md`](.agents/scheduling.md) — Scheduling algorithm, writeback service, pre-placement lock, habit instance generation
- [`.agents/deployment.md`](.agents/deployment.md) — Docker setup, environment variables, PGLite vs Postgres switching
- [`.agents/todo.md`](.agents/todo.md) — Open feature requests, issues, and deferred work items
- [`.agents/plan-19-api-keys.md`](.agents/plan-19-api-keys.md) — Plan for personal API keys (Home Assistant and similar external integrations)
- [`.agents/plan-caldav.md`](.agents/plan-caldav.md) — Optional feature: read-write CalDAV endpoint authenticated via API keys
