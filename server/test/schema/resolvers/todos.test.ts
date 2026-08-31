import { beforeAll, describe, expect, it } from 'vitest';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedActivityType,
  seedTodo,
  seedTodoList,
  seedUser,
} from './test-helpers.ts';

describe('todo resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  // ─── myTodos ──────────────────────────────────────────────────────────────────

  describe('myTodos', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(testSchema, db, '', 'query { myTodos { id } }');
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it("returns only the current user's todos", async () => {
      const { id: userId } = await seedUser(db, 'todos-isolation@example.com');
      const { id: otherId } = await seedUser(db, 'todos-other@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      await seedTodo(db, userId, list.id, { title: 'Mine' });
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);
      await seedTodo(db, otherId, otherList.id, { title: 'Theirs' });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { title } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.myTodos as Array<{ title: string }>;
      expect(items.every((i) => i.title !== 'Theirs')).toBe(true);
    });

    it('resolves the list relation and derived activityType on plain rows', async () => {
      const { id: userId } = await seedUser(db, 'todos-relations@example.com');
      const at = await seedActivityType(db, userId, 'Deep Work');
      const list = await seedTodoList(db, userId, at.id);
      await seedTodo(db, userId, list.id, { title: 'With relations' });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { title list { id name } activityType { id name } } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.myTodos as Array<{
        title: string;
        list: { id: string; name: string } | null;
        activityType: { id: string; name: string } | null;
      }>;
      const todo = items.find((i) => i.title === 'With relations');
      expect(todo?.list?.id).toBe(list.id);
      expect(todo?.activityType?.id).toBe(at.id);
      expect(todo?.activityType?.name).toBe('Deep Work');
    });

    it('filters by listId', async () => {
      const { id: userId } = await seedUser(db, 'todos-listfilter@example.com');
      const at = await seedActivityType(db, userId);
      const list1 = await seedTodoList(db, userId, at.id);
      const list2 = await seedTodoList(db, userId, at.id);
      await seedTodo(db, userId, list1.id, { title: 'In list 1' });
      await seedTodo(db, userId, list2.id, { title: 'In list 2' });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query($id: UUID) { myTodos(where: { listId: { eq: $id } }) { title } }',
        { id: list1.id },
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.myTodos as Array<{ title: string }>;
      expect(items).toHaveLength(1);
      expect(items[0]?.title).toBe('In list 1');
    });

    it('filters completed:true returns only completed todos', async () => {
      const { id: userId } = await seedUser(db, 'todos-completed@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      await seedTodo(db, userId, list.id, {
        title: 'Done',
        completedAt: new Date(),
      });
      await seedTodo(db, userId, list.id, { title: 'Pending' });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos(where: { completedAt: { isNotNull: true } }) { title } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.myTodos as Array<{ title: string }>;
      expect(items.every((i) => i.title === 'Done')).toBe(true);
    });

    it('accepts a custom orderBy argument', async () => {
      const { id: userId } = await seedUser(db, 'todos-orderby@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      await seedTodo(db, userId, list.id, { title: 'Low', priority: 1 });
      await seedTodo(db, userId, list.id, { title: 'High', priority: 10 });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query($o: TodoOrderBy) { myTodos(orderBy: $o) { title priority } }',
        { o: { priority: { direction: 'asc', priority: 1 } } },
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.myTodos as Array<{
        title: string;
        priority: number;
      }>;
      expect(items[0]?.priority).toBeLessThanOrEqual(items[1]?.priority ?? 999);
    });

    it('falls back to default order when orderBy has no entries', async () => {
      const { id: userId } = await seedUser(
        db,
        'todos-orderby-empty@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      await seedTodo(db, userId, list.id, { title: 'Todo' });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query($o: TodoOrderBy) { myTodos(orderBy: $o) { id } }',
        { o: {} },
      );
      expect(result.errors).toBeUndefined();
    });

    it('filters completed:false returns only incomplete todos', async () => {
      const { id: userId } = await seedUser(db, 'todos-incomplete@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      await seedTodo(db, userId, list.id, {
        title: 'Done',
        completedAt: new Date(),
      });
      await seedTodo(db, userId, list.id, { title: 'Pending' });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos(where: { completedAt: { isNull: true } }) { title } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.myTodos as Array<{ title: string }>;
      expect(items.every((i) => i.title === 'Pending')).toBe(true);
    });
  });

  // ─── myCreateTodo ─────────────────────────────────────────────────────────────

  describe('myCreateTodo', () => {
    it('throws when list not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'create-todo-nlist@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTodoArgs!) { myCreateTodo(input: $input) { id } }',
        {
          input: {
            listId: '00000000-0000-0000-0000-000000000000',
            title: 'X',
            estimatedLength: 30,
          },
        },
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when list belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'create-todo-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'create-todo-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTodoArgs!) { myCreateTodo(input: $input) { id } }',
        { input: { listId: otherList.id, title: 'Hack', estimatedLength: 30 } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });

    it('creates a todo with optional dueAt and scheduledAt', async () => {
      const { id: userId } = await seedUser(
        db,
        'create-todo-dates@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTodoArgs!) { myCreateTodo(input: $input) { id title dueAt } }',
        {
          input: {
            listId: list.id,
            title: 'With dates',
            estimatedLength: 60,
            dueAt: '2025-12-31T00:00:00',
          },
        },
      );
      expect(result.errors).toBeUndefined();
      const todo = result.data?.myCreateTodo as {
        title: string;
        dueAt: string;
      };
      expect(todo.title).toBe('With dates');
      expect(todo.dueAt).not.toBeNull();
    });
  });

  // ─── myUpdateTodo ─────────────────────────────────────────────────────────────

  describe('myUpdateTodo', () => {
    it('updates title and priority', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-todo-basic@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const todo = await seedTodo(db, userId, list.id, {
        title: 'Old',
        priority: 1,
      });

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoArgs!) { myUpdateTodo(input: $input) { id title priority } }',
        { input: { id: todo.id, title: 'New', priority: 5 } },
      );
      expect(result.errors).toBeUndefined();
      const updated = result.data?.myUpdateTodo as {
        title: string;
        priority: number;
      };
      expect(updated.title).toBe('New');
      expect(updated.priority).toBe(5);
    });

    it('moves todo to a different list', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-todo-movelist@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list1 = await seedTodoList(db, userId, at.id);
      const list2 = await seedTodoList(db, userId, at.id);
      const todo = await seedTodo(db, userId, list1.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoArgs!) { myUpdateTodo(input: $input) { id } }',
        { input: { id: todo.id, listId: list2.id } },
      );
      expect(result.errors).toBeUndefined();
    });

    it('clears dueAt when set to null', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-todo-nulldue@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const todo = await seedTodo(db, userId, list.id, {
        dueAt: new Date('2025-12-31'),
      });

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoArgs!) { myUpdateTodo(input: $input) { id dueAt } }',
        { input: { id: todo.id, dueAt: null } },
      );
      expect(result.errors).toBeUndefined();
      expect(
        (result.data?.myUpdateTodo as { dueAt: unknown }).dueAt,
      ).toBeNull();
    });

    it('throws when todo not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-todo-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoArgs!) { myUpdateTodo(input: $input) { id } }',
        { input: { id: '00000000-0000-0000-0000-000000000000', title: 'X' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when todo belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-todo-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'update-todo-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);
      const otherTodo = await seedTodo(db, otherId, otherList.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoArgs!) { myUpdateTodo(input: $input) { id } }',
        { input: { id: otherTodo.id, title: 'Hack' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });

    it('throws when target list not found during move', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-todo-movebadlist@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const todo = await seedTodo(db, userId, list.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoArgs!) { myUpdateTodo(input: $input) { id } }',
        {
          input: {
            id: todo.id,
            listId: '00000000-0000-0000-0000-000000000000',
          },
        },
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it("throws Forbidden when moving to another user's list", async () => {
      const { id: userId } = await seedUser(
        db,
        'update-todo-moveforbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'update-todo-moveother@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const todo = await seedTodo(db, userId, list.id);
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoArgs!) { myUpdateTodo(input: $input) { id } }',
        { input: { id: todo.id, listId: otherList.id } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myCompleteTodo ───────────────────────────────────────────────────────────

  describe('myCompleteTodo', () => {
    it('accepts an explicit completedAt timestamp', async () => {
      const { id: userId } = await seedUser(
        db,
        'complete-todo-explicit@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const todo = await seedTodo(db, userId, list.id);

      const ts = '2025-06-01T10:00:00.000Z';
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!, $at: String) { myCompleteTodo(id: $id, completedAt: $at) { completedAt } }',
        { id: todo.id, at: ts },
      );
      expect(result.errors).toBeUndefined();
      const completed = result.data?.myCompleteTodo as { completedAt: string };
      expect(new Date(completed.completedAt).toISOString()).toBe(ts);
    });

    it('throws when todo not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'complete-todo-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation { myCompleteTodo(id: "00000000-0000-0000-0000-000000000000") { id } }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when todo belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'complete-todo-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'complete-todo-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);
      const otherTodo = await seedTodo(db, otherId, otherList.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myCompleteTodo(id: $id) { id } }',
        { id: otherTodo.id },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myDeleteTodo ─────────────────────────────────────────────────────────────

  describe('myDeleteTodo', () => {
    it('deletes a todo and returns true', async () => {
      const { id: userId } = await seedUser(db, 'delete-todo@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const todo = await seedTodo(db, userId, list.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteTodo(id: $id) }',
        { id: todo.id },
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myDeleteTodo).toBe(true);
    });

    it('throws when todo not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-todo-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation { myDeleteTodo(id: "00000000-0000-0000-0000-000000000000") }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when todo belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-todo-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'delete-todo-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);
      const otherTodo = await seedTodo(db, otherId, otherList.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteTodo(id: $id) }',
        { id: otherTodo.id },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myDeleteTodos ────────────────────────────────────────────────────────────

  const DELETE_TODOS = `
    mutation($listId: ID!, $completed: Boolean) {
      myDeleteTodos(listId: $listId, completed: $completed) { id }
    }
  `;

  describe('myDeleteTodos', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(testSchema, db, '', DELETE_TODOS, {
        listId: 'any-list',
        completed: true,
      });
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('with completed: true, deletes only completed todos in the list', async () => {
      const { id: userId } = await seedUser(db, 'bulk-delete@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const done1 = await seedTodo(db, userId, list.id, {
        title: 'Done 1',
        completedAt: new Date(),
      });
      const done2 = await seedTodo(db, userId, list.id, {
        title: 'Done 2',
        completedAt: new Date(),
      });
      const pending = await seedTodo(db, userId, list.id, { title: 'Pending' });

      const result = await gql(testSchema, db, userId, DELETE_TODOS, {
        listId: list.id,
        completed: true,
      });
      expect(result.errors).toBeUndefined();
      const deleted = result.data?.myDeleteTodos as Array<{ id: string }>;
      const deletedIds = deleted.map((t) => t.id);
      expect(deletedIds).toHaveLength(2);
      expect(deletedIds).toEqual(expect.arrayContaining([done1.id, done2.id]));

      const remaining = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { id } }',
      );
      const ids = (remaining.data?.myTodos as Array<{ id: string }>).map(
        (t) => t.id,
      );
      expect(ids).toContain(pending.id);
      expect(ids).not.toContain(done1.id);
    });

    it('scopes deletes to the given list, leaving the same user other lists intact', async () => {
      const { id: userId } = await seedUser(db, 'bulk-delete-list@example.com');
      const at = await seedActivityType(db, userId);
      const listA = await seedTodoList(db, userId, at.id);
      const listB = await seedTodoList(db, userId, at.id);
      const inA = await seedTodo(db, userId, listA.id, {
        title: 'A done',
        completedAt: new Date(),
      });
      const inB = await seedTodo(db, userId, listB.id, {
        title: 'B done',
        completedAt: new Date(),
      });

      const result = await gql(testSchema, db, userId, DELETE_TODOS, {
        listId: listA.id,
        completed: true,
      });
      expect(result.errors).toBeUndefined();
      const deletedIds = (
        result.data?.myDeleteTodos as Array<{ id: string }>
      ).map((t) => t.id);
      expect(deletedIds).toEqual([inA.id]);

      const remaining = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { id } }',
      );
      const ids = (remaining.data?.myTodos as Array<{ id: string }>).map(
        (t) => t.id,
      );
      expect(ids).toContain(inB.id);
    });

    it("never deletes another user's todos, even when targeting their list", async () => {
      const { id: userId } = await seedUser(
        db,
        'bulk-delete-scope@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'bulk-delete-scope-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);
      const theirs = await seedTodo(db, otherId, otherList.id, {
        title: 'Theirs done',
        completedAt: new Date(),
      });

      // Caller targets another user's list id directly; the userId scope must
      // make this a no-op rather than deleting their todos.
      const result = await gql(testSchema, db, userId, DELETE_TODOS, {
        listId: otherList.id,
        completed: true,
      });
      expect(result.errors).toBeUndefined();
      const deletedIds = (
        result.data?.myDeleteTodos as Array<{ id: string }>
      ).map((t) => t.id);
      expect(deletedIds).toHaveLength(0);
      expect(deletedIds).not.toContain(theirs.id);

      const otherRemaining = await gql(
        testSchema,
        db,
        otherId,
        'query { myTodos { id } }',
      );
      const otherIds = (
        otherRemaining.data?.myTodos as Array<{ id: string }>
      ).map((t) => t.id);
      expect(otherIds).toContain(theirs.id);
    });
  });

  // ─── myCompleteTodos / myDeleteTodosById ──────────────────────────────────────

  const COMPLETE_TODOS = `
    mutation($ids: [ID!]!) {
      myCompleteTodos(ids: $ids) { id completedAt scheduledAt }
    }
  `;

  const DELETE_TODOS_BY_ID = `
    mutation($ids: [ID!]!) {
      myDeleteTodosById(ids: $ids) { id }
    }
  `;

  describe('myCompleteTodos', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(testSchema, db, '', COMPLETE_TODOS, {
        ids: [crypto.randomUUID()],
      });
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('completes every id in one call and moves scheduledAt to match', async () => {
      const { id: userId } = await seedUser(db, 'bulk-complete@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const a = await seedTodo(db, userId, list.id, { title: 'A' });
      const b = await seedTodo(db, userId, list.id, { title: 'B' });
      const untouched = await seedTodo(db, userId, list.id, { title: 'C' });

      const result = await gql(testSchema, db, userId, COMPLETE_TODOS, {
        ids: [a.id, b.id],
      });
      expect(result.errors).toBeUndefined();
      const completed = result.data?.myCompleteTodos as Array<{
        id: string;
        completedAt: string | null;
        scheduledAt: string | null;
      }>;
      expect(completed).toHaveLength(2);
      expect(completed.map((t) => t.id).sort()).toEqual([a.id, b.id].sort());
      for (const todo of completed) {
        expect(todo.completedAt).not.toBeNull();
        // Both come back as Date instances from the DateTime scalar.
        expect(todo.scheduledAt).toEqual(todo.completedAt);
      }

      const after = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { id completedAt } }',
      );
      const stillOpen = (
        after.data?.myTodos as Array<{ id: string; completedAt: string | null }>
      ).filter((t) => t.completedAt === null);
      expect(stillOpen.map((t) => t.id)).toEqual([untouched.id]);
    });

    it('rejects the whole batch when one id belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'bulk-complete-mine@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'bulk-complete-theirs@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const mine = await seedTodo(db, userId, list.id, { title: 'Mine' });
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);
      const theirs = await seedTodo(db, otherId, otherList.id, {
        title: 'Theirs',
      });

      const result = await gql(testSchema, db, userId, COMPLETE_TODOS, {
        ids: [mine.id, theirs.id],
      });
      expect(result.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

      // All-or-nothing: the caller's own todo is not completed either.
      const after = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { id completedAt } }',
      );
      const row = (
        after.data?.myTodos as Array<{ id: string; completedAt: string | null }>
      ).find((t) => t.id === mine.id);
      expect(row?.completedAt).toBeNull();
    });

    it('rejects an unknown id as NOT_FOUND', async () => {
      const { id: userId } = await seedUser(
        db,
        'bulk-complete-404@example.com',
      );
      const result = await gql(testSchema, db, userId, COMPLETE_TODOS, {
        ids: [crypto.randomUUID()],
      });
      expect(result.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
    });

    it('rejects an empty id list', async () => {
      const { id: userId } = await seedUser(
        db,
        'bulk-complete-empty@example.com',
      );
      const result = await gql(testSchema, db, userId, COMPLETE_TODOS, {
        ids: [],
      });
      expect(result.errors?.[0]).toBeDefined();
    });
  });

  describe('myDeleteTodosById', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(testSchema, db, '', DELETE_TODOS_BY_ID, {
        ids: [crypto.randomUUID()],
      });
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('deletes exactly the selected todos across lists', async () => {
      const { id: userId } = await seedUser(db, 'bulk-delete-ids@example.com');
      const at = await seedActivityType(db, userId);
      const listA = await seedTodoList(db, userId, at.id);
      const listB = await seedTodoList(db, userId, at.id);
      const a = await seedTodo(db, userId, listA.id, { title: 'A' });
      const b = await seedTodo(db, userId, listB.id, { title: 'B' });
      const keep = await seedTodo(db, userId, listA.id, { title: 'Keep' });

      const result = await gql(testSchema, db, userId, DELETE_TODOS_BY_ID, {
        ids: [a.id, b.id],
      });
      expect(result.errors).toBeUndefined();
      const deleted = (
        result.data?.myDeleteTodosById as Array<{ id: string }>
      ).map((t) => t.id);
      expect(deleted.sort()).toEqual([a.id, b.id].sort());

      const after = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { id } }',
      );
      expect(
        (after.data?.myTodos as Array<{ id: string }>).map((t) => t.id),
      ).toEqual([keep.id]);
    });

    it("refuses to delete another user's todo, leaving the batch intact", async () => {
      const { id: userId } = await seedUser(
        db,
        'bulk-del-ids-mine@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'bulk-del-ids-theirs@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const mine = await seedTodo(db, userId, list.id, { title: 'Mine' });
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);
      const theirs = await seedTodo(db, otherId, otherList.id, {
        title: 'Theirs',
      });

      const result = await gql(testSchema, db, userId, DELETE_TODOS_BY_ID, {
        ids: [mine.id, theirs.id],
      });
      expect(result.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

      const after = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { id } }',
      );
      expect(
        (after.data?.myTodos as Array<{ id: string }>).map((t) => t.id),
      ).toContain(mine.id);
      const otherAfter = await gql(
        testSchema,
        db,
        otherId,
        'query { myTodos { id } }',
      );
      expect(
        (otherAfter.data?.myTodos as Array<{ id: string }>).map((t) => t.id),
      ).toContain(theirs.id);
    });
  });
});
