# Server Patterns

Express + Apollo Server, no build step (`--experimental-strip-types`). All imports **must** include `.ts` extension.

## Startup Behaviour

`seedDemoUser()` always runs on startup. `seedDemoData()` runs in non-production and is idempotent (skips if the demo user already has activity types). Demo seed creates 3 activity types (Work, Exercise, Learning), 3 todo lists (one per activity type), 6 time blocks, 5 todos (distributed across the lists), 3 habits.

## Auth — UUID Bearer Fallback (Dev Only, currently active in prod too — see todo.md #25)

The server context accepts a raw UUID as a Bearer token for backwards compatibility with the demo user (`DEMO_USER_ID`). The fallback runs in **all environments today** — there is no `NODE_ENV` guard. The check lives in `packages/server/src/index.ts` after JWT verification fails:

```typescript
// Try JWT first
const payload = await verifyToken(rawToken);
if (payload?.sub) return { db, userId: payload.sub, loaders };

// Fall back to raw UUID for backwards-compat with dev/seed
if (/^[0-9a-f-]{36}$/i.test(rawToken))
  return { db, userId: rawToken, loaders };
```

This must be guarded with `NODE_ENV !== 'production'` (or removed) before any real public deployment. Tracked in `todo.md` #25.

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
// packages/server/src/context.ts
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

Any new public endpoint (e.g. a webhook or health check) must be added to this set in `packages/server/src/schema/index.ts`.

## Schema Pipeline

```typescript
// packages/server/src/schema/index.ts
const { schema: drizzleSchema } = buildSchema(db, {
  prefixes: { insert: 'create', update: 'update', delete: 'delete' },
  suffixes: { list: 's', single: '' },
  singularTypes: true,
});

export const schema = applyCustomResolvers(drizzleSchema);
blockUnscopedResolvers(schema); // blocks anything not prefixed "my" or in PUBLIC_MUTATIONS
```

## Custom Resolver Pattern (extendSchema)

```typescript
// packages/server/src/schema/resolvers.ts
const extensionSDL = `
  extend type Query {
    myTodos(activityTypeId: ID, completed: Boolean): [Todo!]!
  }
  extend type Mutation {
    myCreateTodo(input: CreateTodoArgs!): Todo!
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

export function applyCustomResolvers(schema: GraphQLSchema): GraphQLSchema {
  const extended = extendSchema(schema, parse(extensionSDL));
  const queryType = extended.getType('Query') as GraphQLObjectType;
  const queryFields = queryType.getFields();
  const mutationType = extended.getType('Mutation') as GraphQLObjectType;
  const mutationFields = mutationType.getFields();

  queryFields.myTodos!.resolve = async (_parent, args, context: Context) => {
    if (!context.userId) throw new Error('Not authenticated');
    return context.db.query.todos.findMany({
      where: eq(todos.userId, context.userId),
    });
  };

  mutationFields.myCreateTodo!.resolve = async (_parent, args, context: Context) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = CreateTodoInput.parse(args.input); // Zod validation
    const [todo] = await context.db.insert(todos).values({ ...input, userId: context.userId }).returning();
    return todo;
  };

  return extended;
}
```

## Guard Clause Pattern

Always check auth and ownership first:

```typescript
if (!context.userId) throw new Error('Not authenticated');
const todo = await context.db.query.todos.findFirst({ where: eq(todos.id, id) });
if (!todo) throw new Error(`Todo ${id} not found`);
if (todo.userId !== context.userId) throw new Error('Forbidden');
```

## Zod Validation at Resolver Boundary

All validators live in `packages/server/src/schema/validators.ts`, with coverage in `packages/server/test/schema/validators.test.ts`. Key constraints:

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

## Auth (JWT + Magic Links)

```typescript
// packages/server/src/auth.ts — jose library
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

**Generation and verification live in `packages/server/src/api-keys.ts`:**
- `generateApiKey()` — creates a token + hash + 8-char display prefix
- `isApiKey(raw)` — prefix detection
- `hashApiKey(raw)` — SHA-256 hex
- `constantTimeEqual(a, b)` — timing-safe comparison

**Auth chain (in `index.ts`):** JWT → API key (if `isApiKey(raw)`) → UUID fallback. On a valid key hit, `lastUsedAt` is updated fire-and-forget and the context gains `apiKey: { id, scopes }`.

**No-self-management guard:** `myCreateApiKey` and `myRevokeApiKey` both throw `'API keys cannot manage other keys'` when `context.apiKey` is set. API key holders cannot create or revoke keys — only interactive (JWT) sessions can.

## DataLoader (N+1 Prevention)

Loaders are created per-request in context. Use them in type resolvers:

```typescript
// Habit and TimeBlock: direct activityTypeId
activityType: async (parent, _args, context: Context) => {
  if (!parent.activityTypeId) return null;
  return context.loaders.activityType.load(parent.activityTypeId);
},

// Todo: derived via the list. Two batched loader calls, both DataLoader-deduped.
const todoActivityType = async (parent, _args, context: Context) => {
  const list = await context.loaders.todoList.load(parent.listId);
  if (!list) return null;
  return context.loaders.activityType.load(list.activityTypeId);
};
```

## iCal Endpoint

`GET /ical?userId=<uuid>` — public, no auth token required. Returns a `.ics` feed for the current and next week. The scheduler is called with `user.timezone` so it emits UTC ISO strings directly; the iCal handler parses them with `new Date(item.scheduledStart)`.

The URL is intentionally public (no secret). Users are warned to treat it like a password.

## Auth — Email Not Wired in Production

Magic links are logged to the server console in both dev and prod. In dev, `requestMagicLink` also returns `magicLink` in the GraphQL response. In production the response has `magicLink: null`. There is a TODO to integrate Resend or Nodemailer — email is not yet sent.

**Convention for email-adjacent features:** log to console in dev, leave a `// TODO: send email via Resend/Nodemailer` comment for production. Do not block features on the email provider being wired up.

## Resolver File Structure

Each domain has its own resolver file exporting an `apply*Resolvers(queryFields, mutationFields)` function:

```
packages/server/src/schema/resolvers/
  index.ts          — extensionSDL + wires all apply* functions
  todo-lists.ts     — applyTodoListResolvers
  todos.ts          — applyTodoResolvers
  habits.ts         — applyHabitResolvers
  time-blocks.ts    — applyTimeBlockResolvers
  activity-types.ts — applyActivityTypeResolvers
  schedule.ts       — applyScheduleResolvers
  stats.ts          — applyStatsResolvers
  profile.ts        — applyProfileResolvers
  auth.ts           — applyAuthResolvers
```

New resolver domains follow the same pattern. SDL goes in `extensionSDL` in `index.ts`; resolver functions go in a new domain file.

## Scheduler Service (Pure Function)

```typescript
// packages/server/src/services/scheduler.ts
export type TodoWithActivityType = Todo & { activityTypeId: string | null };

export function computeSchedule(
  weekStartStr: string,
  timeBlocks: TimeBlock[],
  todos: TodoWithActivityType[],
  habits: Array<Habit & { instanceIndex: number }>,
  activityTypeMap: Map<string, ActivityType>,
): ScheduledItem[] { ... }
```

Pure function — deterministic, easy to unit test. Coverage in `packages/server/test/services/scheduler.test.ts`.

Since `todos.activityTypeId` no longer exists on the DB row, callers (`schedule.ts`, `scheduler-writeback.ts`, `ical-route.ts`) fetch `todoLists` alongside `todos`, build a `Map<listId, activityTypeId>`, and enrich each todo before passing it in.

## Tests

The server package has the following vitest suites — run with `npm test` from the repo root:

- `packages/server/test/auth.test.ts` — magic-link token + JWT helpers
- `packages/server/test/schema/validators.test.ts` — Zod validator coverage
- `packages/server/test/services/scheduler.test.ts` — pure scheduler algorithm

Resolver-level integration tests (PGLite in-memory) are not yet in place — see todo.md #15.
