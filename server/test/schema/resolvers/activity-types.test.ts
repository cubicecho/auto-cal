import { todos } from '@auto-cal/db/schema';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedActivityType,
  seedHabit,
  seedTodoList,
  seedUser,
} from './test-helpers.ts';

describe('activity-type resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  // ─── myActivityTypes ──────────────────────────────────────────────────────────

  describe('myActivityTypes', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'query { myActivityTypes { id } }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it("returns only the current user's activity types", async () => {
      const { id: userId } = await seedUser(db, 'at-isolation@example.com');
      const { id: otherId } = await seedUser(db, 'at-other@example.com');
      await seedActivityType(db, userId, 'Mine');
      await seedActivityType(db, otherId, 'Theirs');

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myActivityTypes { name } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.myActivityTypes as Array<{ name: string }>;
      expect(items.every((i) => i.name !== 'Theirs')).toBe(true);
    });
  });

  // ─── myActivityTypeStats ────────────────────────────────────────────────────────

  describe('myActivityTypeStats', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'query { myActivityTypeStats { activityTypeId } }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('returns stats with zero counts for empty activity type', async () => {
      const { id: userId } = await seedUser(db, 'atstats-empty@example.com');
      await seedActivityType(db, userId, 'Empty');

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myActivityTypeStats { activityTypeId activityTypeName totalTodos completedTodos totalHabits } }',
      );
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myActivityTypeStats as Array<{
        totalTodos: number;
        totalHabits: number;
      }>;
      expect(stats[0]?.totalTodos).toBe(0);
      expect(stats[0]?.totalHabits).toBe(0);
    });

    it('counts todos and habits by activity type', async () => {
      const { id: userId } = await seedUser(db, 'atstats-counts@example.com');
      const at = await seedActivityType(db, userId, 'Work');
      const list = await seedTodoList(db, userId, at.id);
      const now = new Date();
      await db.insert(todos).values({
        userId,
        listId: list.id,
        title: 'Done',
        estimatedLength: 30,
        scheduledAt: now,
        completedAt: now,
      });
      await db.insert(todos).values({
        userId,
        listId: list.id,
        title: 'Pending',
        estimatedLength: 30,
      });
      await seedHabit(db, userId, at.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myActivityTypeStats { totalTodos completedTodos totalHabits } }',
      );
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myActivityTypeStats as Array<{
        totalTodos: number;
        completedTodos: number;
        totalHabits: number;
      }>;
      expect(stats[0]?.totalHabits).toBe(1);
    });

    it('respects startDate/endDate for todo counts', async () => {
      const { id: userId } = await seedUser(
        db,
        'atstats-datefilter@example.com',
      );
      const at = await seedActivityType(db, userId, 'Work');
      const list = await seedTodoList(db, userId, at.id);
      await db.insert(todos).values({
        userId,
        listId: list.id,
        title: 'Old',
        estimatedLength: 30,
        scheduledAt: new Date('2020-01-01'),
      });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query($s: String, $e: String) { myActivityTypeStats(startDate: $s, endDate: $e) { totalTodos } }',
        { s: '2025-01-01', e: '2025-12-31' },
      );
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myActivityTypeStats as Array<{
        totalTodos: number;
      }>;
      expect(stats[0]?.totalTodos).toBe(0);
    });

    it('counts todos without scheduledAt or completedAt when no date range is given', async () => {
      const { id: userId } = await seedUser(
        db,
        'atstats-unscheduled@example.com',
      );
      const at = await seedActivityType(db, userId, 'Work');
      const list = await seedTodoList(db, userId, at.id);
      await db.insert(todos).values({
        userId,
        listId: list.id,
        title: 'Unscheduled',
        estimatedLength: 30,
      });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myActivityTypeStats { totalTodos } }',
      );
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myActivityTypeStats as Array<{
        totalTodos: number;
      }>;
      expect(stats[0]?.totalTodos).toBe(1);
    });
  });

  // ─── myUpdateActivityType ─────────────────────────────────────────────────────

  describe('myUpdateActivityType', () => {
    it('updates name and color', async () => {
      const { id: userId } = await seedUser(db, 'update-at@example.com');
      const at = await seedActivityType(db, userId, 'Old');

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateActivityTypeArgs!) { myUpdateActivityType(input: $input) { id name color } }',
        { input: { id: at.id, name: 'New', color: '#ff0000' } },
      );
      expect(result.errors).toBeUndefined();
      const updated = result.data?.myUpdateActivityType as {
        name: string;
        color: string;
      };
      expect(updated.name).toBe('New');
      expect(updated.color).toBe('#ff0000');
    });

    it('throws when activity type not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-at-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateActivityTypeArgs!) { myUpdateActivityType(input: $input) { id } }',
        { input: { id: '00000000-0000-0000-0000-000000000000', name: 'X' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when activity type belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-at-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(db, 'update-at-other@example.com');
      const otherAt = await seedActivityType(db, otherId);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateActivityTypeArgs!) { myUpdateActivityType(input: $input) { id } }',
        { input: { id: otherAt.id, name: 'Hack' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myDeleteActivityType ─────────────────────────────────────────────────────

  describe('myDeleteActivityType', () => {
    it('deletes an activity type and returns true', async () => {
      const { id: userId } = await seedUser(db, 'delete-at@example.com');
      const at = await seedActivityType(db, userId);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteActivityType(id: $id) }',
        { id: at.id },
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myDeleteActivityType).toBe(true);
    });

    it('throws when activity type not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-at-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation { myDeleteActivityType(id: "00000000-0000-0000-0000-000000000000") }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when activity type belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-at-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(db, 'delete-at-other@example.com');
      const otherAt = await seedActivityType(db, otherId);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteActivityType(id: $id) }',
        { id: otherAt.id },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });
});
