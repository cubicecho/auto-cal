# Server Patterns

Express + Apollo Server, no build step (`--experimental-strip-types`). All imports **must** include `.ts` extension.

## Startup Behaviour

No data is seeded on startup. Users are created on demand by `verifyMagicLink`.

## Magic-link exposure (`EXPOSE_MAGIC_LINK`)

`requestMagicLink` only returns the `magicLink` in its response when
`magicLinkExposed()` (`server/src/config.ts`) is true: outside
production, or in any environment when `EXPOSE_MAGIC_LINK` is set (`1`/`true`/`yes`).
This gives the dev-style passwordless login on local/secure-network deployments
that have no email provider. In production without the flag, the link is only
logged server-side and the response returns `magicLink: null`.

## Auth — UUID Bearer Fallback (Dev Only)

The server context accepts a raw UUID as a Bearer token (dev convenience). The check lives in `server/src/index.ts` after JWT and API-key verification both fail:

```typescript
// Env-var bypass: accept one specific UUID in ANY environment, production
// included. Logs a warning on boot.
const bypassUuid = process.env.BYPASS_AUTH_UUID;
if (bypassUuid && rawToken === bypassUuid)
  return { db, userId: rawToken, loaders, appBaseUrl: baseUrl };

// General fallback: any UUID is a user id — dev and test only.
if (process.env.NODE_ENV !== 'production' && /^[0-9a-f-]{36}$/i.test(rawToken))
  return { db, userId: rawToken, loaders, appBaseUrl: baseUrl };
```

The general fallback is production-guarded. `BYPASS_AUTH_UUID` deliberately is
not — it exists for local/secure-network deployments with no email provider,
the same niche `EXPOSE_MAGIC_LINK` serves. It is a single-account password
sitting in an env var: anyone who learns the value is logged in as that user
with no second factor and no expiry. Never set it on an internet-facing
instance, and do not "fix" the missing guard by adding one — the flag has no
purpose in an environment where it would be guarded off.

## mySchedule vs DB scheduledAt

`mySchedule` re-computes the schedule fresh from scratch on every call using `computeSchedule` — it does **not** read `scheduledAt` from the DB for non-pinned todos. The DB `scheduledAt` is written by `runSchedulerWriteback` and used for:
1. The pre-placement lock (writeback won't move a todo that already has a valid future slot)
2. The "Unschedulable" indicator in `TodoItem` (todo belongs to a list with an activity type but `scheduledAt` is null — typically because no matching time block exists)

Manually-pinned todos (`manuallyScheduled: true`) are the exception — they use their stored `scheduledAt` directly in `mySchedule`.

`myReschedule` is the only mutation that **awaits** the writeback (it's user-triggered and the client expects confirmation). All other mutations fire-and-forget.

## Scheduler Writeback — Fire-and-Forget

`runSchedulerWriteback` is called without `await` so mutations return immediately. Errors are swallowed with `.catch(console.error)` — the client never sees a scheduler failure:

```typescript
runSchedulerWriteback(context.db, context.userId).catch(console.error);
return result; // returned before writeback finishes
```

Do not await it. Do not surface scheduler errors to the client.

## Context

```typescript
// server/src/context.ts
export interface Context {
  db: DB;
  userId?: string;           // undefined = not authenticated
  loaders: ReturnType<typeof createLoaders>;
}

export function createLoaders(db: DB) {
  return {
    activityType: new DataLoader<string, ActivityType | null>(async (ids) => {
      const rows = await db.query.activityTypes.findMany({
        where: { id: { in: [...ids] } },
      });
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
    todoList: new DataLoader<string, TodoList | null>(async (ids) => {
      const rows = await db.query.todoLists.findMany({
        where: { id: { in: [...ids] } },
      });
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
  };
}
```

## Public Mutations

Only two mutations bypass the `my*` scoping requirement and are accessible without authentication:

```typescript
const PUBLIC_MUTATIONS = new Set(['requestMagicLink', 'verifyMagicLink']);
```

Any new public endpoint (e.g. a webhook or health check) must be added to this set in `server/src/schema/resolvers/index.ts` — `finalizeSchema` removes mutations it does not recognise.

## Schema Pipeline

**`graphql` is held at 16 by a root `overrides` entry.** `graphql-parse-resolve-info`
— a required peer of `@vantreeseba/drizzle-graphql` — has no graphql 17 support, so
drizzle-graphql 9 bounds its own peer range below 17. The override keeps a
transitive dependency from pulling graphql 17 in beside it. (The root and server
`package.json` previously carried a `resolutions` block for the same purpose;
npm ignores `resolutions` — it is a yarn field — so it never did anything.)


```typescript
// server/src/schema/index.ts
import { buildSchemaConfig } from './build-config.ts';

const { schema: drizzleSchema } = buildSchema(db, buildSchemaConfig);

// applyCustomResolvers starts with scopeRootFields (which renames the
// generated queries to their my* form, guards them with requireUser, and
// drops the rest — the row scope itself is in buildSchemaConfig) and ends
// with finalizeSchema (which removes every mutation not prefixed "my" or
// listed in PUBLIC_MUTATIONS).
export const schema = applyCustomResolvers(drizzleSchema);
```

`buildSchemaConfig` lives in `server/src/schema/build-config.ts` and is shared by the runtime schema, `generate_schema.ts`, and the tests so the SDL is identical everywhere. It maps type names (`typeNameMapper`, which replaced v3's `prefixes`/`suffixes`/`singularTypes`), carries the tenant `scope` (`TABLE_SCOPE`, see below), the per-table ordering `defaults`, the `exclude`d `keyHash` column, and turns off both aggregate features plus **all four generated CRUD mutations** — `insert`, `update`, `updateMany`, `delete`.

Disabling all four means drizzle-graphql emits no `Mutation` type at all. That is deliberate: every write goes through a hand-written `my*` resolver, so the ~50 generated mutation fields existed only to be stripped again, while still reaching client codegen (~400 lines of dead SDL). The consequence is that `extensionSDL` must **declare** `type Mutation` instead of extending it, and wire it as a root operation explicitly.

### `scopeRootFields`

`applyCustomResolvers` opens with `scopeRootFields(schema)` (`server/src/schema/scope.ts`) — a `mapSchema` pass over `MapperKind.QUERY_ROOT_FIELD` that decides what happens to each of the 20 generated root queries.

A `QUERY_ROOT_FIELD` mapper may return `[newName, fieldConfig]`, which is the whole mechanism: it renames the field *and* rewraps the resolver already attached to it, in one pass. Nine fields are exposed under their `my*` name; the other eleven return `null` and are deleted.

The tenant predicate is **not** applied here. It lives in `TABLE_SCOPE` (same file) and is handed to `buildSchema` as `scope`, so the wrapper adds only a `requireUser` guard — an unauthenticated `myTodos` is one UNAUTHENTICATED error at the root rather than whatever the scope hook raises deeper in.

```typescript
/** For each table, the predicate every generated read of it is confined to. */
export const TABLE_SCOPE: ScopeConfig<Context> = {
  users:  (context) => ({ id: { eq: requireUser(context) } }),
  todos:  ownedByUser,
  apiKeys: (context) => ({
    userId: { eq: requireUser(context) },
    revokedAt: { isNull: true },
  }),
  habitCompletions: (context) => ({
    habit: { userId: { eq: requireUser(context) } },
  }),
  // …
};

/** Which generated root queries are served, under what name, off what table. */
export const QUERY_SCOPE: Record<string, ScopedField> = {
  user:  { as: 'myProfile', table: 'users' },
  todos: { as: 'myTodos',   table: 'todos' },
  // …
};
```

The rules are deliberately not uniform: `users` has no `userId` column (the caller *is* the row, so it scopes by `id`), `apiKeys` folds `revokedAt: { isNull: true }` in so a caller-supplied `where` cannot resurrect a revoked key, and `habitCompletions`/`projectNotes` own no user column at all and scope through the relation to the parent that does.

Four things to keep in mind when touching this file:

1. **Scope per table, not per field.** A root-field wrapper only sees what passes through a root resolver, and a nested relation field never does — that is why the predicate lives in `TABLE_SCOPE`. The library ANDs it on **last, after the caller's `where`**, so a caller filter can only ever narrow it. Do not reintroduce composition in the wrapper; there would then be two places to keep in step.
2. **Every table must be scoped.** `assertEveryTableScoped` runs from `build-config.ts` over the real Drizzle schema at import time, so adding a table without a scope fails the boot. A `QUERY_SCOPE` entry whose `table` has no scope throws too.
3. **Every generated field must be named.** A field in neither `QUERY_SCOPE` nor `UNEXPOSED` throws at boot, so adding a Drizzle table cannot quietly produce a hidden query. `UNEXPOSED` holds the eleven that are deliberately not served: the single-row variants (redundant with the list form plus a `where`), `users`, and the parent-owned leaves `projectNotes`/`habitCompletions`.
4. **Do not prune here.** `extensionSDL` references generated input types that are unreferenced at this point in the pipeline. `finalizeSchema` prunes last.

Relation traversal has two independent guards: the table scope above, and the generated relation loader ANDing the foreign-key predicate with the caller's filter. That matters most for `myProfile`, a graph entry point onto every relation the `users` table has. `server/test/schema/resolvers/scope.test.ts` pins all of it, because the behaviour lives in a bumpable dependency — when changing it, negative-test by breaking one `TABLE_SCOPE` entry and confirming the suite fails.

### `finalizeSchema`

`applyCustomResolvers` returns `finalizeSchema(extended)` — a single `mapSchema` pass followed by `pruneSchema`. It must run **last**, because `mapSchema` rebuilds the schema and any `field.resolve = ...` assignment made afterwards would land on a discarded copy.

1. **Asserts the query surface.** Every `Query` field must be `my*`-prefixed by this point. `scopeRootFields` handled the generated ones; this catches a hand-written field added to `extensionSDL` under the wrong name.
2. **Removes unscoped mutations.** Anything not prefixed `my` and not in `PUBLIC_MUTATIONS` is dropped. Removed, not given a throwing resolver — that would leave it in the SDL, in introspection, and in client codegen as an autocompletable operation that always failed at runtime. Removing the field moves the failure to validation.
3. **Prunes.** The root fields `scopeRootFields` removed were the only reference to a chunk of generated input types. `pruneSchema` collects them. It does not gut the SDL — generated relation fields still carry `*Filters`/`*OrderBy` args, so the bulk of the input types stay.

Adding a public (non-`my`) mutation means adding its name to `PUBLIC_MUTATIONS` in `resolvers/index.ts`, or it will be removed. `server/test/schema/resolvers/index.test.ts` asserts both root types hold nothing else.

## Custom Resolver Pattern (extendSchema)

Almost everything hand-written here is a mutation. A query belongs in
`extensionSDL` only when it computes something the generated resolvers cannot —
today that is `myActivityTypeStats`, `myHabitStats`, `myHabitDetail`, `myStats`,
and `mySchedule`. A query that only needs "the caller's rows, filtered" is an
entry in `QUERY_SCOPE`, not a resolver.

```typescript
// server/src/schema/resolvers.ts
const extensionSDL = `
  extend type Query {
    mySchedule(weekStart: String, timezone: String): [ScheduledItem!]!
  }
  # Declared, not extended — build-config disables every generated mutation,
  # so there is no Mutation type to extend.
  type Mutation {
    myCreateTodo(input: CreateTodoArgs!): Todo!
  }
  # extendSchema does not auto-promote a conventionally-named type to a root
  # operation, so Mutation (and Subscription) must be wired by hand.
  extend schema {
    mutation: Mutation
    subscription: Subscription
  }
  input CreateTodoArgs {
    listId: ID!
    title: String!
    priority: Int
    estimatedLength: Int
    dueAt: String
    scheduledAt: String
  }
`;

// server/src/schema/resolvers/todos.ts
export const todoMutations: MutationMap<'myCreateTodo'> = {
  myCreateTodo: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = CreateTodoInput.parse(args.input); // Zod validation
    const [todo] = await context.db.insert(todos).values({ ...input, userId }).returning();
    if (!todo) throw new Error('Failed to create todo');
    return todo;
  },
};

// server/src/schema/resolvers/index.ts
export function applyCustomResolvers(schema: GraphQLSchema): GraphQLSchema {
  // scopeRootFields first: it renames and scopes the generated queries, and
  // must not prune, because extensionSDL references generated input types.
  const extended = extendSchema(scopeRootFields(schema), parse(extensionSDL));
  const queryType = extended.getType('Query') as GraphQLObjectType;
  const mutationType = extended.getType('Mutation') as GraphQLObjectType;

  attach(queryType, { ...scheduleQueries, ...statsQueries /* … */ });
  attach(mutationType, { ...todoMutations, ...habitMutations /* … */ });

  return finalizeSchema(extended);
}
```

### Typed resolver maps

`QueryMap`/`MutationMap`/`SubscriptionMap` live in
`server/src/schema/resolvers/types.ts` and are `Required<Pick<…>>` over the
resolver types graphql-codegen derives from the SDL:

```typescript
export type QueryMap<K extends keyof QueryResolvers> = Required<Pick<QueryResolvers, K>>;
```

What this buys over the old `queryFields.myTodos!.resolve = …` assignment:

- `args` and the return value are checked against the SDL, so no per-resolver
  `args: { id: string }` annotations and no `context: Context` annotation
- a misspelled field name is a compile error rather than a silently orphaned
  resolver; `attach()` additionally throws at startup if a resolver names a
  field the schema does not have
- no `!` assertions, so no `noNonNullAssertion` suppressions

`Required<Pick<…>>` rather than plain `Pick<…>`: every key named in the type
parameter must actually be implemented.

`FieldMap<TypeName, K>` is the same thing for a field on an object type, and
goes through the same `attach()`:

```typescript
export const todoFields: FieldMap<'Todo', 'activityType'> = {
  activityType: async (parent, _args, context) => { … },
};
```

`parent` here is the **Drizzle row**, not the GraphQL type — `codegen.server.ts`
maps every table-backed type to its row (`Todo: '@auto-cal/db#Todo as TodoRow'`),
so `parent.listId` is checked against the actual column set. That is what the
old hand-written `parent: { listId: string }` shapes were approximating.

Only four fields need one: `ActivityType.parent`/`children` (a self-reference
the SDL declares, plus its inverse), `Project.list` (custom SDL field), and
`Todo.activityType` (a derived hop through the todo's list — `todos` has no
`activityTypeId` column). Every other relation field gets a generated resolver
from drizzle-graphql; do not hand-write one.

`Project.notes` used to be a fifth, overriding the generated resolver purely to
force position order. Ordering is declarative now — `defaults` in
`build-config.ts` — and it applies to relation fields as well as root queries,
so reach for that instead of a resolver. Note that in an `orderBy` entry
`priority` is the tiebreak rank and **the highest number sorts first**, not the
key's position in the object.

The import of `__generated__/resolvers.ts` in `types.ts` is **type-only** and
must stay that way. That file is generated *from* the SDL these resolver files
produce, so a value import would be a bootstrap cycle; Node's type stripping
erases the type-only form before it can bite, which is what lets
`generate_schema.ts` run on a tree with no `__generated__/` at all. (`tsc
--noEmit` does need codegen to have run first — see CLAUDE.md.)

### codegen mappers

`codegen.server.ts` sets two options this pattern depends on:

- `mappers` — every table-backed GraphQL type maps to its Drizzle row
  (`ActivityType: '@auto-cal/db#ActivityType as ActivityTypeRow'`). Resolvers
  return plain rows and let the generated relation resolvers fill in the rest,
  so the parent/return type must be the DB row, not the fully-resolved GraphQL
  object. Without the mappers, `myActivityTypes` would have to satisfy
  `children: ActivityType[]`. The `as *Row` alias is required: the bare name
  collides with the type the `typescript` plugin generates from the SDL.
- `enumsAsTypes` — string unions rather than TS enums, matching the
  `db/src/models/enums.ts` convention. TS enums are nominal, so a resolver
  could not return the plain `'created'` it publishes.

## Guard Clause Pattern

Always check auth and ownership first:

```typescript
if (!context.userId) throw new Error('Not authenticated');
const todo = await context.db.query.todos.findFirst({ where: eq(todos.id, id) });
if (!todo) throw new Error(`Todo ${id} not found`);
if (todo.userId !== context.userId) throw new Error('Forbidden');
```

## Zod Validation at Resolver Boundary

All validators live in `server/src/schema/validators.ts`, with coverage in `server/test/schema/validators.test.ts`. Key constraints:

| Field | Rule |
|-------|------|
| `title` | min 1, max 200 |
| `description` | max 2000, optional |
| `priority` | int 0–100, default 0 |
| `estimatedLength` | int 1–1440 (minutes); optional on create — defaults to `0` in the resolver. `0` is a valid state meaning "unestimated" — the item won't be auto-scheduled until a length is set. UI should allow 0 / no estimate. |
| `frequencyCount` | int 1–30 |
| `color` | must match `#[0-9a-fA-F]{6}` |
| `daysOfWeek` | array of 0–6, min 1, max 7, unique |
| `startTime` / `endTime` | `HH:mm` format; end must be after start |
| `scheduledAt` | local datetime string (no `Z`) |

```typescript
// In resolver:
const input = CreateTodoInput.parse(args.input);
```

**Every** validator belongs in `validators.ts` — never declare one next to the
resolver that uses it. `UpdateHabitInput` and `UpdateTimeBlockInput` were both
declared twice, and the copy in `validators.ts` fell a schema change behind
without anyone noticing, because the resolver was importing the other one and
the tests were exercising the dead one.

`server/test/schema/validator-drift.test.ts` walks every input type reachable
from a `Mutation` argument and asserts it has a validator whose fields match
the SDL exactly. A field added to the SDL but not to Zod is the failure worth
catching: Zod strips unknown keys, so the resolver's `input.newField` is
`undefined` forever and the setting silently does nothing. Adding a field means
touching `extensionSDL`, the validator, and the resolver together; this test is
what says so.

## Auth (JWT + Magic Links)

```typescript
// server/src/auth.ts — jose library
export async function signSessionToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ sub?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { sub?: string };
  } catch {
    return null;
  }
}
```

Context extraction in `index.ts`:
```typescript
context: async ({ req }): Promise<Context> => {
  const rawToken = req.headers.authorization?.slice(7);
  if (!rawToken) return { db, loaders };
  const payload = await verifyToken(rawToken);
  if (payload?.sub) return { db, userId: payload.sub, loaders };
  return { db, loaders };
},
```

## API Keys

Personal, per-user, revocable Bearer tokens for headless integrations.

**Token format:** `acal_<base64url(32 random bytes)>` — the `acal_` prefix lets `isApiKey()` distinguish these from JWTs and UUIDs.

**Hash stored, not token:** Only the SHA-256 hex of the full token is persisted in `api_keys.keyHash`. The raw token is returned once to the user on creation and never stored.

The column is excluded from the generated schema outright, in `build-config.ts`:

```typescript
exclude: {
  columns: { apiKeys: ['keyHash'] },
},
```

That covers every surface derived from the column list at once — the `ApiKey` object type, `ApiKeyFilters`, `ApiKeyOrderBy`, `ApiKeyDistinctColumn` — which is what matters, because deleting the output field alone is only half of it. All of those are reachable through the live `User.apiKeys` relation, and `where: { keyHash: { eq: "..." } }` confirms a guessed hash while `orderBy` binary-searches it, neither of which requires selecting the field. Adding another never-expose column means adding it to this list.

The server still reads and writes the column through Drizzle directly (`auth`, `ical-route`, `myCreateApiKey`) — this is a GraphQL-surface rule, not a database one. It logs "excluded column 'apiKeys.keyHash' is NOT NULL with no default" at build time, which does not apply here because `features.insert` is off. The four assertions in `api-keys.test.ts` cover all four surfaces.

**Generation and verification live in `server/src/api-keys.ts`:**
- `generateApiKey()` — creates a token + hash + 8-char display prefix
- `isApiKey(raw)` — prefix detection
- `hashApiKey(raw)` — SHA-256 hex
- `constantTimeEqual(a, b)` — timing-safe comparison

**Auth chain (in `index.ts`):** JWT → API key (if `isApiKey(raw)`) → `BYPASS_AUTH_UUID` → UUID fallback (dev only). On a valid key hit, `lastUsedAt` is updated fire-and-forget and the context gains `apiKey: { id, scopes }`.

**No-self-management guard:** `myCreateApiKey` and `myRevokeApiKey` both throw `'API keys cannot manage other keys'` when `context.apiKey` is set. API key holders cannot create or revoke keys — only interactive (JWT) sessions can.

## Relation Fields & DataLoaders (N+1 Prevention)

drizzle-graphql attaches a resolver to every Drizzle-relation field: it returns eager data when the parent query pre-fetched it, and otherwise batches sibling loads in the same execution tick into one IN-clause query. Plain rows returned by custom resolvers therefore resolve their relation fields with no extra wiring.

Per-request DataLoaders (in `context.ts`) are only for fields the generated machinery can't handle — derived hops and custom SDL fields:

```typescript
// Todo.activityType: derived via the list. Two batched loader calls, both DataLoader-deduped.
const todoActivityType = async (parent, _args, context: Context) => {
  const list = await context.loaders.todoList.load(parent.listId);
  if (!list) return null;
  return context.loaders.activityType.load(list.activityTypeId);
};
```

`Project.notes` is the one Drizzle relation whose generated resolver is overridden: the notes must come back in `position` order (see `myReorderProjectNotes`), which the generated lazy loader does not apply.

## iCal Endpoint

`GET /ical?userId=<uuid>` — public, no auth token required. Returns a `.ics` feed for the current and next week. The scheduler is called with `user.timezone` so it emits UTC ISO strings directly; the iCal handler parses them with `new Date(item.scheduledStart)`.

The URL is intentionally public (no secret). Users are warned to treat it like a password.

## Auth — Email Not Wired in Production

Magic links are logged to the server console in both dev and prod. In dev, `requestMagicLink` also returns `magicLink` in the GraphQL response. In production the response has `magicLink: null`. There is a TODO to integrate Resend or Nodemailer — email is not yet sent.

**Convention for email-adjacent features:** log to console in dev, leave a `// TODO: send email via Resend/Nodemailer` comment for production. Do not block features on the email provider being wired up.

## Resolver File Structure

Each domain has its own resolver file exporting typed maps keyed by field name:

```
server/src/schema/resolvers/
  index.ts          — extensionSDL + attach()es every map, then finalizeSchema
  types.ts          — QueryMap / MutationMap / SubscriptionMap helpers
  todo-lists.ts     — todoListQueries, todoListMutations
  todos.ts          — todoQueries, todoMutations
  habits.ts         — habitQueries, habitMutations
  time-blocks.ts    — timeBlockQueries, timeBlockMutations
  activity-types.ts — activityTypeQueries, activityTypeMutations
  projects.ts       — projectQueries, projectMutations
  api-keys.ts       — apiKeyQueries, apiKeyMutations
  schedule.ts       — scheduleQueries, scheduleMutations
  stats.ts          — statsQueries
  profile.ts        — profileQueries, profileMutations
  import.ts         — importMutations
  auth.ts           — authMutations
  subscriptions.ts  — subscriptionResolvers + the publish* helpers
```

New resolver domains follow the same pattern. SDL goes in `extensionSDL` in `index.ts`; the typed maps go in a new domain file and get spread into the `attach()` calls.

## Scheduler Service (Pure Function)

```typescript
// server/src/services/scheduler.ts
export type TodoWithActivityType = Todo & { activityTypeId: string | null };

export function computeSchedule(
  weekStartStr: string,
  timeBlocks: TimeBlock[],
  todos: TodoWithActivityType[],
  habits: Array<Habit & { instanceIndex: number }>,
  activityTypeMap: Map<string, ActivityType>,
): ScheduledItem[] { ... }
```

Pure function — deterministic, easy to unit test. Coverage in `server/test/services/scheduler.test.ts`.

Since `todos.activityTypeId` no longer exists on the DB row, callers (`schedule.ts`, `scheduler-writeback.ts`, `ical-route.ts`) fetch `todoLists` alongside `todos`, build a `Map<listId, activityTypeId>`, and enrich each todo before passing it in.

## Tests

The server package has the following vitest suites — run with `npm test` from the repo root:

- `server/test/auth.test.ts` — magic-link token + JWT helpers
- `server/test/schema/validators.test.ts` — Zod validator coverage
- `server/test/services/scheduler.test.ts` — pure scheduler algorithm

- `server/test/schema/resolvers/index.test.ts` — resolver integration over in-memory PGLite
- `server/test/schema/resolvers/scope.test.ts` — tenant-isolation guarantees

The client has no behavioural tests yet — see
[cubicecho/auto-cal#57](https://github.com/cubicecho/auto-cal/issues/57).
