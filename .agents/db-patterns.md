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

## Dual-Backend Connection

```typescript
// db/src/index.ts
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  // Production: postgres.js
  const postgres = await import('postgres');
  const client = postgres.default(databaseUrl);
  db = drizzle({ client, schema });
} else {
  // Dev: PGLite (embedded, zero-setup)
  const { PGlite } = await import('@electric-sql/pglite');
  const client = new PGlite(process.env.PGLITE_DATA_DIR);
  db = drizzle({ client, schema });
}
```

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
