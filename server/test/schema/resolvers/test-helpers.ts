/**
 * Shared test helpers for resolver integration tests.
 * Each test file gets fresh PGLite instances — no shared state between files.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relations } from '@auto-cal/db/relations';
import {
  activityTypes,
  habits,
  timeBlocks,
  todoLists,
  todos,
  users,
} from '@auto-cal/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { buildSchema } from '@vantreeseba/drizzle-graphql';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { graphql } from 'graphql';
import { createLoaders } from '../../../src/context.ts';
import { buildSchemaConfig } from '../../../src/schema/build-config.ts';
import { applyCustomResolvers } from '../../../src/schema/resolvers/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../../../db/drizzle');

export async function createTestDb() {
  const client = new PGlite('memory://');
  await client.waitReady;
  const db = drizzle({ client, relations });
  await migrate(db, { migrationsFolder });
  return db;
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

export function buildTestSchema(db: TestDb) {
  const { schema: drizzleSchema } = buildSchema(db, buildSchemaConfig);
  return applyCustomResolvers(drizzleSchema);
}

export type TestSchema = ReturnType<typeof buildTestSchema>;

export async function gql(
  testSchema: TestSchema,
  db: TestDb,
  userId: string,
  source: string,
  variableValues?: Record<string, unknown>,
) {
  return graphql({
    schema: testSchema,
    source,
    variableValues,
    contextValue: { db, userId, loaders: createLoaders(db) },
  });
}

// ─── Seed helpers ─────────────────────────────────────────────────────────────

export async function seedUser(db: TestDb, email = 'test@example.com') {
  const [user] = await db.insert(users).values({ email }).returning();
  if (!user) throw new Error('Failed to create user');
  return user;
}

export async function seedActivityType(
  db: TestDb,
  userId: string,
  name = 'Work',
) {
  const [at] = await db
    .insert(activityTypes)
    .values({ userId, name, color: '#6366f1' })
    .returning();
  if (!at) throw new Error('Failed to create activity type');
  return at;
}

export async function seedTimeBlock(
  db: TestDb,
  userId: string,
  activityTypeId: string,
) {
  const [tb] = await db
    .insert(timeBlocks)
    .values({
      userId,
      activityTypeId,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '17:00',
      priority: 0,
    })
    .returning();
  if (!tb) throw new Error('Failed to create time block');
  return tb;
}

export async function seedTodoList(
  db: TestDb,
  userId: string,
  activityTypeId: string,
) {
  const [list] = await db
    .insert(todoLists)
    .values({ userId, name: 'Test List', activityTypeId })
    .returning();
  if (!list) throw new Error('Failed to create todo list');
  return list;
}

export async function seedTodo(
  db: TestDb,
  userId: string,
  listId: string,
  overrides: Partial<typeof todos.$inferInsert> = {},
) {
  const [todo] = await db
    .insert(todos)
    .values({
      userId,
      listId,
      title: 'Test todo',
      estimatedLength: 30,
      priority: 1,
      ...overrides,
    })
    .returning();
  if (!todo) throw new Error('Failed to create todo');
  return todo;
}

export async function seedHabit(
  db: TestDb,
  userId: string,
  activityTypeId: string,
  overrides: Partial<typeof habits.$inferInsert> = {},
) {
  const [habit] = await db
    .insert(habits)
    .values({
      userId,
      activityTypeId,
      title: 'Test habit',
      estimatedLength: 30,
      frequencyCount: 3,
      frequencyUnit: 'week',
      priority: 1,
      ...overrides,
    })
    .returning();
  if (!habit) throw new Error('Failed to create habit');
  return habit;
}
