import { todoLists, todos } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedActivityType,
  seedUser,
} from './test-helpers.ts';

const IMPORT = `
  mutation($input: ImportTodosArgs!) {
    myImportTodos(input: $input) {
      listsCreated
      todosCreated
    }
  }
`;

describe('import resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  it('throws when not authenticated', async () => {
    const result = await gql(testSchema, db, '', IMPORT, {
      input: { lists: [] },
    });
    expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
  });

  it('creates lists and todos from an import payload', async () => {
    const { id: userId } = await seedUser(db, 'import-basic@example.com');
    const at = await seedActivityType(db, userId);

    const result = await gql(testSchema, db, userId, IMPORT, {
      input: {
        lists: [
          {
            name: 'Groceries',
            activityTypeId: at.id,
            defaultPriority: 25,
            defaultEstimatedLength: 15,
            todos: [
              { title: 'Milk' },
              {
                title: 'Eggs',
                completedAt: '2026-07-01T10:00:00.000Z',
                dueAt: '2026-07-02T00:00:00.000Z',
              },
            ],
          },
          {
            name: 'Work',
            activityTypeId: at.id,
            todos: [{ title: 'Ship it', description: 'the thing' }],
          },
        ],
      },
    });

    expect(result.errors).toBeUndefined();
    const res = result.data?.myImportTodos as {
      listsCreated: number;
      todosCreated: number;
    };
    expect(res.listsCreated).toBe(2);
    expect(res.todosCreated).toBe(3);

    const lists = await db.query.todoLists.findMany({ where: { userId } });
    expect(lists.map((l) => l.name).sort()).toEqual(['Groceries', 'Work']);

    const groceries = lists.find((l) => l.name === 'Groceries');
    if (!groceries) throw new Error('missing list');
    expect(groceries.defaultPriority).toBe(25);
    expect(groceries.defaultEstimatedLength).toBe(15);

    const gTodos = await db.query.todos.findMany({
      where: { listId: groceries.id },
    });
    // Todos inherit the list defaults for priority/length.
    expect(gTodos.every((t) => t.priority === 25)).toBe(true);
    expect(gTodos.every((t) => t.estimatedLength === 15)).toBe(true);
    const eggs = gTodos.find((t) => t.title === 'Eggs');
    expect(eggs?.completedAt).toBeInstanceOf(Date);
    expect(eggs?.dueAt).toBeInstanceOf(Date);
  });

  it('rejects an activity type owned by another user without writing anything', async () => {
    const { id: userId } = await seedUser(db, 'import-forbidden@example.com');
    const { id: otherId } = await seedUser(db, 'import-other@example.com');
    const otherAt = await seedActivityType(db, otherId);

    const result = await gql(testSchema, db, userId, IMPORT, {
      input: {
        lists: [
          {
            name: 'Sneaky',
            activityTypeId: otherAt.id,
            todos: [{ title: 'x' }],
          },
        ],
      },
    });

    expect(result.errors?.[0]?.message).toMatch(/not found/i);
    const lists = await db.query.todoLists.findMany({ where: { userId } });
    expect(lists).toHaveLength(0);
  });

  it('rolls back the whole import if one list fails', async () => {
    const { id: userId } = await seedUser(db, 'import-rollback@example.com');
    const at = await seedActivityType(db, userId);

    // Second list references a bogus activity type — the up-front ownership
    // check throws before the transaction, so the first list must not persist.
    const result = await gql(testSchema, db, userId, IMPORT, {
      input: {
        lists: [
          { name: 'Good', activityTypeId: at.id, todos: [{ title: 'a' }] },
          {
            name: 'Bad',
            activityTypeId: '00000000-0000-0000-0000-000000000000',
            todos: [{ title: 'b' }],
          },
        ],
      },
    });

    expect(result.errors?.[0]?.message).toMatch(/not found/i);
    const lists = await db
      .select()
      .from(todoLists)
      .where(eq(todoLists.userId, userId));
    expect(lists).toHaveLength(0);
    const allTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId));
    expect(allTodos).toHaveLength(0);
  });
});
