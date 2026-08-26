/**
 * Resolver integration tests using PGLite in-memory.
 *
 * These tests exercise the full resolver layer without HTTP or a real DB on
 * disk. Each test gets a fresh in-memory PGLite instance with migrations
 * applied so there is no cross-test state.
 *
 * Import note: we intentionally bypass `server/src/schema/index.ts`
 * (which pulls in the live `@auto-cal/db` singleton and requires env vars).
 * Instead we build the test schema directly from the resolver index + a
 * freshly created PGLite drizzle instance.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relations } from '@auto-cal/db/relations';
import * as schema from '@auto-cal/db/schema';
import { users } from '@auto-cal/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { buildSchema } from '@vantreeseba/drizzle-graphql';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { graphql } from 'graphql';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createLoaders } from '../../../src/context.ts';
import { buildSchemaConfig } from '../../../src/schema/build-config.ts';
import { applyCustomResolvers } from '../../../src/schema/resolvers/index.ts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../../../db/drizzle');

/** Build a fresh in-memory DB with all migrations applied. */
async function createTestDb() {
  const client = new PGlite('memory://');
  await client.waitReady;
  // @ts-expect-error drizzle-orm 1.0-beta removed `schema` from config types but it remains valid at runtime
  const db = drizzle({ client, schema, relations });
  await migrate(db, { migrationsFolder });
  return db;
}

/** Build the full GraphQL schema wired to the given drizzle instance. */
function buildTestSchema(db: Awaited<ReturnType<typeof createTestDb>>) {
  const { schema: drizzleSchema } = buildSchema(db, buildSchemaConfig);
  return applyCustomResolvers(drizzleSchema);
}

/** Execute a GraphQL document against the test schema with an authenticated context. */
async function exec(
  testSchema: ReturnType<typeof buildTestSchema>,
  db: Awaited<ReturnType<typeof createTestDb>>,
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('resolver integration tests', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  let testSchema: ReturnType<typeof buildTestSchema>;
  let userId: string;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  beforeEach(async () => {
    const [user] = await db
      .insert(users)
      .values({ email: `integration-${Date.now()}@example.com` })
      .returning();
    if (!user) throw new Error('Failed to create test user');
    userId = user.id;
  });

  it('myCreateActivityType → appears in myActivityTypes', async () => {
    const createResult = await exec(
      testSchema,
      db,
      userId,
      `mutation {
        myCreateActivityType(input: { name: "Work", color: "#6366f1" }) {
          id
          name
          color
        }
      }`,
    );

    expect(createResult.errors).toBeUndefined();
    const created = createResult.data?.myCreateActivityType as {
      id: string;
      name: string;
      color: string;
    };
    expect(created.name).toBe('Work');
    expect(created.color).toBe('#6366f1');

    const listResult = await exec(
      testSchema,
      db,
      userId,
      'query { myActivityTypes { id name } }',
    );
    expect(listResult.errors).toBeUndefined();
    const list = listResult.data?.myActivityTypes as Array<{
      id: string;
      name: string;
    }>;
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe('Work');
  });

  it('myCreateTodoList + myCreateTodo → todo appears in myTodos', async () => {
    // Create the prerequisite activity type
    const atResult = await exec(
      testSchema,
      db,
      userId,
      `mutation {
        myCreateActivityType(input: { name: "Personal" }) { id }
      }`,
    );
    expect(atResult.errors).toBeUndefined();
    const atId = (atResult.data?.myCreateActivityType as { id: string }).id;

    // Create the todo list
    const listResult = await exec(
      testSchema,
      db,
      userId,
      `mutation($input: CreateTodoListArgs!) {
        myCreateTodoList(input: $input) { id name }
      }`,
      { input: { name: 'Home Tasks', activityTypeId: atId } },
    );
    expect(listResult.errors).toBeUndefined();
    const listId = (listResult.data?.myCreateTodoList as { id: string }).id;

    // Create a todo
    const todoResult = await exec(
      testSchema,
      db,
      userId,
      `mutation($input: CreateTodoArgs!) {
        myCreateTodo(input: $input) { id title completedAt }
      }`,
      { input: { listId, title: 'Buy groceries', estimatedLength: 30 } },
    );
    expect(todoResult.errors).toBeUndefined();
    const todo = todoResult.data?.myCreateTodo as {
      id: string;
      title: string;
      completedAt: string | null;
    };
    expect(todo.title).toBe('Buy groceries');
    expect(todo.completedAt).toBeNull();

    // Verify it appears in myTodos
    const todosResult = await exec(
      testSchema,
      db,
      userId,
      'query { myTodos { id title } }',
    );
    expect(todosResult.errors).toBeUndefined();
    const todos = todosResult.data?.myTodos as Array<{
      id: string;
      title: string;
    }>;
    expect(todos.some((t) => t.title === 'Buy groceries')).toBe(true);
  });

  it('myCompleteTodo → completedAt is set and appears in myTodos(completed: true)', async () => {
    // Create activity type, list, and todo
    const atResult = await exec(
      testSchema,
      db,
      userId,
      `mutation {
        myCreateActivityType(input: { name: "Work" }) { id }
      }`,
    );
    const atId = (atResult.data?.myCreateActivityType as { id: string }).id;

    const listResult = await exec(
      testSchema,
      db,
      userId,
      `mutation($input: CreateTodoListArgs!) {
        myCreateTodoList(input: $input) { id }
      }`,
      { input: { name: 'Sprint', activityTypeId: atId } },
    );
    const listId = (listResult.data?.myCreateTodoList as { id: string }).id;

    const todoResult = await exec(
      testSchema,
      db,
      userId,
      `mutation($input: CreateTodoArgs!) {
        myCreateTodo(input: $input) { id }
      }`,
      { input: { listId, title: 'Fix bug', estimatedLength: 60 } },
    );
    const todoId = (todoResult.data?.myCreateTodo as { id: string }).id;

    // Complete the todo
    const completeResult = await exec(
      testSchema,
      db,
      userId,
      `mutation($id: ID!) {
        myCompleteTodo(id: $id) { id completedAt }
      }`,
      { id: todoId },
    );
    expect(completeResult.errors).toBeUndefined();
    const completed = completeResult.data?.myCompleteTodo as {
      id: string;
      completedAt: string | null;
    };
    expect(completed.completedAt).not.toBeNull();

    // It should appear in myTodos(completed: true)
    const completedList = await exec(
      testSchema,
      db,
      userId,
      'query { myTodos(completed: true) { id title } }',
    );
    expect(completedList.errors).toBeUndefined();
    const completedTodos = completedList.data?.myTodos as Array<{
      id: string;
      title: string;
    }>;
    expect(completedTodos.some((t) => t.id === todoId)).toBe(true);

    // It should NOT appear in myTodos(completed: false)
    const incompleteTodos = await exec(
      testSchema,
      db,
      userId,
      'query { myTodos(completed: false) { id } }',
    );
    expect(incompleteTodos.errors).toBeUndefined();
    const incompleteList = incompleteTodos.data?.myTodos as Array<{
      id: string;
    }>;
    expect(incompleteList.some((t) => t.id === todoId)).toBe(false);
  });
});

describe('mutation surface', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  let testSchema: ReturnType<typeof buildTestSchema>;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  // build-config turns every generated CRUD mutation off, which makes
  // drizzle-graphql omit the Mutation type; resolvers/index.ts declares its own
  // and wires it with `extend schema { mutation: Mutation }`. If either half
  // regresses the root operation silently disappears, so assert it directly.
  it('wires our own Mutation type as the root mutation operation', () => {
    expect(testSchema.getMutationType()?.name).toBe('Mutation');
  });

  it('exposes only user-scoped and explicitly public mutations', () => {
    const publicMutations = ['requestMagicLink', 'verifyMagicLink'];
    const unscoped = Object.keys(
      testSchema.getMutationType()?.getFields() ?? {},
    ).filter(
      (name) => !name.startsWith('my') && !publicMutations.includes(name),
    );
    expect(unscoped).toEqual([]);
  });
});
