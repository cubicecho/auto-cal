import { habitCompletions, todos } from '@auto-cal/db/schema';
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

describe('stats resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  const STATS_QUERY = `
    query($start: String, $end: String) {
      myStats(startDate: $start, endDate: $end) {
        weightedScore habitScore todoScore
        todos { total completed overdue completionRate }
        habits { habitId title completionRate completions target frequencyUnit frequencyCount }
      }
    }
  `;

  // ─── myStats ──────────────────────────────────────────────────────────────────

  describe('myStats', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'query { myStats { weightedScore } }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('returns null scores with no data', async () => {
      const { id: userId } = await seedUser(db, 'stats-empty@example.com');
      const result = await gql(testSchema, db, userId, STATS_QUERY);
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myStats as Record<string, unknown>;
      expect(stats.weightedScore).toBeNull();
      expect(stats.habitScore).toBeNull();
      expect(stats.todoScore).toBeNull();
      expect((stats.todos as { total: number }).total).toBe(0);
    });

    it('returns habit score based on completions', async () => {
      const { id: userId } = await seedUser(db, 'stats-habitscore@example.com');
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id, {
        frequencyCount: 2,
        frequencyUnit: 'week',
      });
      await db
        .insert(habitCompletions)
        .values({ habitId: habit.id, completedAt: new Date() });

      const result = await gql(testSchema, db, userId, STATS_QUERY);
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myStats as Record<string, unknown>;
      expect(stats.habitScore).not.toBeNull();
      const habitsSummary = stats.habits as Array<{ completions: number }>;
      expect(habitsSummary[0]?.completions).toBe(1);
    });

    it('returns 1.0 habitScore when target is zero (no elapsed time)', async () => {
      const { id: userId } = await seedUser(db, 'stats-zerotarget@example.com');
      const at = await seedActivityType(db, userId);
      await seedHabit(db, userId, at.id, {
        frequencyCount: 3,
        frequencyUnit: 'week',
      });

      const now = new Date().toISOString().slice(0, 10);
      const result = await gql(testSchema, db, userId, STATS_QUERY, {
        start: now,
        end: now,
      });
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myStats as Record<string, unknown>;
      const summaries = stats.habits as Array<{ completionRate: number }>;
      expect(summaries[0]?.completionRate).toBe(1);
    });

    it('returns todo stats for scheduled todos', async () => {
      const { id: userId } = await seedUser(db, 'stats-todos@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      const now = new Date();
      const future = new Date(Date.now() + 86_400_000);
      await db.insert(todos).values([
        {
          userId,
          listId: list.id,
          title: 'Done',
          estimatedLength: 30,
          scheduledAt: now,
          completedAt: now,
        },
        {
          userId,
          listId: list.id,
          title: 'Overdue',
          estimatedLength: 30,
          scheduledAt: new Date(Date.now() - 86_400_000),
        },
        {
          userId,
          listId: list.id,
          title: 'Pending',
          estimatedLength: 30,
          scheduledAt: future,
        },
      ]);

      const farFuture = new Date(Date.now() + 30 * 86_400_000).toISOString();
      const result = await gql(testSchema, db, userId, STATS_QUERY, {
        end: farFuture,
      });
      expect(result.errors).toBeUndefined();
      const todosData = (result.data?.myStats as Record<string, unknown>)
        .todos as {
        total: number;
        completed: number;
        overdue: number;
      };
      expect(todosData.total).toBe(3);
      expect(todosData.completed).toBe(1);
      expect(todosData.overdue).toBe(1);
    });

    it('produces a weighted score when both habit and todo data are present', async () => {
      const { id: userId } = await seedUser(db, 'stats-weighted@example.com');
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id, {
        frequencyCount: 1,
        frequencyUnit: 'week',
      });
      await db
        .insert(habitCompletions)
        .values({ habitId: habit.id, completedAt: new Date() });
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

      const result = await gql(testSchema, db, userId, STATS_QUERY);
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myStats as Record<string, unknown>;
      expect(stats.weightedScore).not.toBeNull();
    });

    it('respects startDate filter for todos', async () => {
      const { id: userId } = await seedUser(db, 'stats-datefilter@example.com');
      const at = await seedActivityType(db, userId);
      const list = await seedTodoList(db, userId, at.id);
      await db.insert(todos).values({
        userId,
        listId: list.id,
        title: 'Old',
        estimatedLength: 30,
        scheduledAt: new Date('2020-01-01'),
      });

      const result = await gql(testSchema, db, userId, STATS_QUERY, {
        start: '2025-01-01T00:00:00',
        end: new Date().toISOString(),
      });
      expect(result.errors).toBeUndefined();
      const todosData = (result.data?.myStats as Record<string, unknown>)
        .todos as { total: number };
      expect(todosData.total).toBe(0);
    });

    it('uses monthly frequencyUnit for habit rate calculation', async () => {
      const { id: userId } = await seedUser(db, 'stats-monthly@example.com');
      const at = await seedActivityType(db, userId);
      await seedHabit(db, userId, at.id, {
        frequencyCount: 4,
        frequencyUnit: 'month',
      });

      const result = await gql(testSchema, db, userId, STATS_QUERY);
      expect(result.errors).toBeUndefined();
      const summaries = (result.data?.myStats as Record<string, unknown>)
        .habits as Array<{ frequencyUnit: string }>;
      expect(summaries[0]?.frequencyUnit).toBe('month');
    });
  });
});
