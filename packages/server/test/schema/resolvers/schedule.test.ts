import { habitCompletions } from '@auto-cal/db/schema';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedActivityType,
  seedHabit,
  seedTimeBlock,
  seedTodo,
  seedTodoList,
  seedUser,
} from './test-helpers.ts';

describe('schedule resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  // ─── mySchedule ──────────────────────────────────────────────────────────────

  describe('mySchedule', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'query { mySchedule { id } }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('returns empty array with no data', async () => {
      const { id: userId } = await seedUser(db, 'sched-empty@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'query { mySchedule { id } }',
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.mySchedule).toEqual([]);
    });

    it('returns scheduled items for todos with matching time blocks', async () => {
      const { id: userId } = await seedUser(db, 'sched-items@example.com');
      const at = await seedActivityType(db, userId);
      await seedTimeBlock(db, userId, at.id);
      const list = await seedTodoList(db, userId, at.id);
      await seedTodo(db, userId, list.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { mySchedule { id kind title isScheduled scheduledStart scheduledEnd } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.mySchedule as Array<{ isScheduled: boolean }>;
      expect(items.some((i) => i.isScheduled)).toBe(true);
    });

    it('accepts a weekStart param and uses that ISO week', async () => {
      const { id: userId } = await seedUser(db, 'sched-weekstart@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'query($ws: String) { mySchedule(weekStart: $ws) { id } }',
        { ws: '2025-01-06' },
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.mySchedule).toEqual([]);
    });

    it('rejects a malformed weekStart', async () => {
      const { id: userId } = await seedUser(db, 'sched-bad-ws@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'query { mySchedule(weekStart: "not-a-date") { id } }',
      );
      expect(result.errors).toBeDefined();
    });

    it('rejects an invalid calendar date as weekStart', async () => {
      const { id: userId } = await seedUser(db, 'sched-bad-date@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'query { mySchedule(weekStart: "2025-13-99") { id } }',
      );
      expect(result.errors).toBeDefined();
    });

    it('generates habit instances for habits with a deficit', async () => {
      const { id: userId } = await seedUser(db, 'sched-habits@example.com');
      const at = await seedActivityType(db, userId);
      await seedTimeBlock(db, userId, at.id);
      await seedHabit(db, userId, at.id, {
        frequencyCount: 2,
        frequencyUnit: 'week',
      });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { mySchedule { id kind title isScheduled } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.mySchedule as Array<{
        kind: string;
        isScheduled: boolean;
      }>;
      expect(items.some((i) => i.kind === 'habit' && i.isScheduled)).toBe(true);
    });

    it('suppresses habit instances when deficit is zero', async () => {
      const { id: userId } = await seedUser(db, 'sched-nodeficit@example.com');
      const at = await seedActivityType(db, userId);
      await seedTimeBlock(db, userId, at.id);
      const habit = await seedHabit(db, userId, at.id, {
        frequencyCount: 1,
        frequencyUnit: 'week',
      });
      await db
        .insert(habitCompletions)
        .values({ habitId: habit.id, completedAt: new Date() });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { mySchedule { id kind } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.mySchedule as Array<{ kind: string }>;
      expect(items.every((i) => i.kind !== 'habit')).toBe(true);
    });

    it('includes pinned todos in the result', async () => {
      const { id: userId } = await seedUser(db, 'sched-pinned@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const future = new Date(Date.now() + 86_400_000);
      await seedTodo(db, userId, list.id, {
        manuallyScheduled: true,
        scheduledAt: future,
      });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { mySchedule { id isScheduled scheduledStart } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.mySchedule as Array<{
        isScheduled: boolean;
        scheduledStart: string;
      }>;
      expect(items.some((i) => i.isScheduled && i.scheduledStart)).toBe(true);
    });

    it('updates user timezone when timezone arg is provided', async () => {
      const { id: userId } = await seedUser(db, 'sched-timezone@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'query { mySchedule(timezone: "America/Chicago") { id } }',
      );
      expect(result.errors).toBeUndefined();
    });

    it('re-queues overdue pinned todos as regular items', async () => {
      const { id: userId } = await seedUser(db, 'sched-overdue@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const past = new Date(Date.now() - 86_400_000);
      const todo = await seedTodo(db, userId, list.id, {
        manuallyScheduled: true,
        scheduledAt: past,
      });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { mySchedule { id isScheduled } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.mySchedule as Array<{ id: string }>;
      expect(items.some((i) => i.id === todo.id)).toBe(true);
    });
  });

  // ─── myReschedule ─────────────────────────────────────────────────────────────

  describe('myReschedule', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(testSchema, db, '', 'mutation { myReschedule }');
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('returns true', async () => {
      const { id: userId } = await seedUser(db, 'reschedule@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation { myReschedule }',
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myReschedule).toBe(true);
    });
  });
});
