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

describe('todo-list resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  // ─── myTodoLists ──────────────────────────────────────────────────────────────

  describe('myTodoLists', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'query { myTodoLists { id } }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it("returns only the current user's lists", async () => {
      const { id: userId } = await seedUser(
        db,
        'todolists-isolation@example.com',
      );
      const { id: otherId } = await seedUser(db, 'todolists-other@example.com');
      const at = await seedActivityType(db, userId);
      const otherAt = await seedActivityType(db, otherId);
      await seedTodoList(db, userId, at.id);
      await seedTodoList(db, otherId, otherAt.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myTodoLists { id } }',
      );
      expect(result.errors).toBeUndefined();
      expect((result.data?.myTodoLists as unknown[]).length).toBe(1);
    });
  });

  // ─── myCreateTodoList ─────────────────────────────────────────────────────────

  describe('myCreateTodoList', () => {
    it('creates a list and returns it', async () => {
      const { id: userId } = await seedUser(db, 'create-list@example.com');
      const at = await seedActivityType(db, userId);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTodoListArgs!) { myCreateTodoList(input: $input) { id name } }',
        { input: { name: 'My List', activityTypeId: at.id } },
      );
      expect(result.errors).toBeUndefined();
      expect((result.data?.myCreateTodoList as { name: string }).name).toBe(
        'My List',
      );
    });

    it('throws when activity type not found', async () => {
      const { id: userId } = await seedUser(db, 'create-list-noat@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTodoListArgs!) { myCreateTodoList(input: $input) { id } }',
        {
          input: {
            name: 'X',
            activityTypeId: '00000000-0000-0000-0000-000000000000',
          },
        },
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when activity type belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'create-list-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'create-list-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTodoListArgs!) { myCreateTodoList(input: $input) { id } }',
        { input: { name: 'Hack', activityTypeId: otherAt.id } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myUpdateTodoList ─────────────────────────────────────────────────────────

  describe('myUpdateTodoList', () => {
    it('updates list name', async () => {
      const { id: userId } = await seedUser(db, 'update-list@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoListArgs!) { myUpdateTodoList(input: $input) { id name } }',
        { input: { id: list.id, name: 'Renamed' } },
      );
      expect(result.errors).toBeUndefined();
      expect((result.data?.myUpdateTodoList as { name: string }).name).toBe(
        'Renamed',
      );
    });

    it('throws when list not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-list-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoListArgs!) { myUpdateTodoList(input: $input) { id } }',
        { input: { id: '00000000-0000-0000-0000-000000000000', name: 'X' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when list belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-list-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'update-list-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoListArgs!) { myUpdateTodoList(input: $input) { id } }',
        { input: { id: otherList.id, name: 'Hack' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });

    it('throws when new activity type not found', async () => {
      const { id: userId } = await seedUser(db, 'update-list-noat@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoListArgs!) { myUpdateTodoList(input: $input) { id } }',
        {
          input: {
            id: list.id,
            activityTypeId: '00000000-0000-0000-0000-000000000000',
          },
        },
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when new activity type belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-list-atforbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'update-list-atother@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const otherAt = await seedActivityType(db, otherId);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTodoListArgs!) { myUpdateTodoList(input: $input) { id } }',
        { input: { id: list.id, activityTypeId: otherAt.id } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myDeleteTodoList ─────────────────────────────────────────────────────────

  describe('myDeleteTodoList', () => {
    it('deletes an empty list and returns true', async () => {
      const { id: userId } = await seedUser(db, 'delete-list@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteTodoList(id: $id) }',
        { id: list.id },
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myDeleteTodoList).toBe(true);
    });

    it('throws when list not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-list-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation { myDeleteTodoList(id: "00000000-0000-0000-0000-000000000000") }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when list belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-list-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'delete-list-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherList = await seedTodoList(db, otherId, otherAt.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteTodoList(id: $id) }',
        { id: otherList.id },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });

    it('throws when list still contains todos', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-list-hastodos@example.com',
      );
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      await seedTodo(db, userId, list.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteTodoList(id: $id) }',
        { id: list.id },
      );
      expect(result.errors?.[0]?.message).toMatch(/cannot delete/i);
    });
  });
});
