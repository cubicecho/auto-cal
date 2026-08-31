# Database Patterns

Schema lives in `db/src/models/`, re-exported from `db/src/schema.ts`.

## Table Definition

```typescript
// db/src/models/todos.ts
export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  listId: uuid('list_id')
    .notNull()
    .references(() => todoLists.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: integer('priority').notNull().default(0),
  estimatedLength: integer('estimated_length').notNull(),
  dueAt: timestamp('due_at'),
  scheduledAt: timestamp('scheduled_at'),
  completedAt: timestamp('completed_at'),
  manuallyScheduled: boolean('manually_scheduled').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Always infer types — never manually duplicate
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
```

Todos no longer carry an `activityTypeId` directly — it's resolved through `todos.listId → todo_lists.activityTypeId`. The `Todo.activityType` GraphQL field is a field-resolver that chains the `todoList` and `activityType` DataLoaders (see `server-patterns.md`).

## Enum Pattern

```typescript
// db/src/models/enums.ts
export const FREQUENCY_UNITS = ['week', 'month'] as const;
export type FrequencyUnit = (typeof FREQUENCY_UNITS)[number];

// Used in schema:
frequencyUnit: text('frequency_unit').notNull().$type<FrequencyUnit>()
```

## Connection

Postgres via postgres.js, and nothing else. `DATABASE_URL` is required — the
module throws at import time without it rather than falling back, so a
misconfigured deploy fails on boot instead of quietly running on an embedded
database.

```typescript
// db/src/index.ts
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required. …');

const client = postgres(databaseUrl);
const db = drizzle({ client, relations });

await migrate(db, { migrationsFolder });
```

`relations` (from `defineRelations(schema, …)`) carries the tables, so the
constructor takes no separate `schema` argument — drizzle-orm 1.0.0-rc.4 removed
it along with `db._.fullSchema`. Passing one is silently ignored.

Migrations run here, on import, so every entry point (server, `migrator.ts`,
scripts) gets a migrated database without coordinating.

**Tests do not use this module.** They build their own in-memory PGLite and
migrate it per file — see `server/test/schema/resolvers/test-helpers.ts`:

```typescript
const client = new PGlite('memory://');
const db = drizzle({ client, relations });
await migrate(db, { migrationsFolder });
```

That is the only remaining use of PGLite in the repo; it is a devDependency of
`server`, so a production install never pulls it in.

**`DB` is the driver-agnostic type, not `typeof db`.** The runtime instance is a
`PostgresJsDatabase`, but every shared signature (`Context['db']`,
`runSchedulerWriteback`, `createLoaders`, …) is written against the exported
alias:

```typescript
export type DB = PgAsyncDatabase<PgQueryResultHKT, typeof relations>;
```

postgres.js and PGLite produce the same database class parameterised by
different query-result HKTs, so widening to the base is what lets the tests hand
their PGLite instance to server code with no cast anywhere. Narrowing this to
`typeof db` puts an `as unknown as` at every test call site; do not.

**`drizzle-orm` and `drizzle-kit` are pinned to an exact version**, not a range.
Their prerelease tags carry a commit hash (`1.0.0-rc.5-ab785fc`), and semver
compares a non-numeric identifier as *greater* than a numeric one — so
`1.0.0-rc.2-e38a2ba` satisfies `~1.0.0-rc.5` and npm reports the older build as
up to date. Bump both by editing the exact string in `db/package.json` and
`server/package.json` together; they must stay on the same build.

## Query Patterns

```typescript
// Single record
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});

// List with conditions
const items = await db.query.todos.findMany({
  where: and(
    eq(todos.userId, context.userId),
    isNull(todos.completedAt),
  ),
  orderBy: [desc(todos.priority), desc(todos.createdAt)],
});

// Insert + return
const [row] = await db.insert(todos).values({ ...input, userId }).returning();

// Update
await db
  .update(todos)
  .set({ completedAt: new Date(), updatedAt: new Date() })
  .where(and(eq(todos.id, id), eq(todos.userId, userId)));

// Delete
await db.delete(todos).where(and(eq(todos.id, id), eq(todos.userId, userId)));
```

## Seed Pattern

There is no seed script. Users are created on demand by the magic-link flow
(`verifyMagicLink` inserts the user if the email is new). The old demo user /
demo data seed (`seedDemoUser` / `seedDemoData`) was removed.

## Migrations

```bash
npm run db:generate   # after schema changes
npm run db:migrate    # apply migrations
npm run db:studio     # GUI
```

Migration files live in `db/drizzle/` — never edit manually.

## Foreign Key Conventions

- User-owned resources: `references(() => users.id, { onDelete: 'cascade' })`
- Required references where the parent must not be deleted while children exist: `references(() => activityTypes.id, { onDelete: 'restrict' })` (current default for activity-type and list FKs)
- All PKs: `uuid('id').primaryKey().defaultRandom()`
- All timestamps: Postgres `timestamp` type (not `timestamptz`)
