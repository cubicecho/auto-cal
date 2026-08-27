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
  seedUser,
} from './test-helpers.ts';

describe('habit resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  // ─── myHabits ─────────────────────────────────────────────────────────────────

  describe('myHabits', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(testSchema, db, '', 'query { myHabits { id } }');
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it("returns only the current user's habits", async () => {
      const { id: userId } = await seedUser(db, 'habits-isolation@example.com');
      const { id: otherId } = await seedUser(db, 'habits-other@example.com');
      const at = await seedActivityType(db, userId);
      await seedHabit(db, userId, at.id, { title: 'Mine' });
      const otherAt = await seedActivityType(db, otherId);
      await seedHabit(db, otherId, otherAt.id, { title: 'Theirs' });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myHabits { title } }',
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.myHabits as Array<{ title: string }>;
      expect(items.every((i) => i.title !== 'Theirs')).toBe(true);
    });

    it('filters by activityTypeId', async () => {
      const { id: userId } = await seedUser(db, 'habits-atfilter@example.com');
      const at1 = await seedActivityType(db, userId, 'Work');
      const at2 = await seedActivityType(db, userId, 'Exercise');
      await seedHabit(db, userId, at1.id, { title: 'Work habit' });
      await seedHabit(db, userId, at2.id, { title: 'Exercise habit' });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query($id: UUID) { myHabits(where: { activityTypeId: { eq: $id } }) { title } }',
        { id: at2.id },
      );
      expect(result.errors).toBeUndefined();
      const items = result.data?.myHabits as Array<{ title: string }>;
      expect(items).toHaveLength(1);
      expect(items[0]?.title).toBe('Exercise habit');
    });
  });

  // ─── myHabitStats ───────────────────────────────────────────────────────────────

  describe('myHabitStats', () => {
    it('returns empty array when user has no habits', async () => {
      const { id: userId } = await seedUser(db, 'habitstats-empty@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myHabitStats { habitId } }',
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myHabitStats).toEqual([]);
    });

    it('returns completion rate per habit', async () => {
      const { id: userId } = await seedUser(db, 'habitstats-rate@example.com');
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id, { frequencyCount: 4 });
      await db
        .insert(habitCompletions)
        .values({ habitId: habit.id, completedAt: new Date() });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myHabitStats { habitId title completionRate totalCompletions } }',
      );
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myHabitStats as Array<{
        totalCompletions: number;
        completionRate: number;
      }>;
      expect(stats[0]?.totalCompletions).toBe(1);
      expect(stats[0]?.completionRate).toBeCloseTo(0.25);
    });

    it('filters by habitId', async () => {
      const { id: userId } = await seedUser(
        db,
        'habitstats-filter@example.com',
      );
      const at = await seedActivityType(db, userId);
      const h1 = await seedHabit(db, userId, at.id, { title: 'H1' });
      await seedHabit(db, userId, at.id, { title: 'H2' });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query($id: ID) { myHabitStats(habitId: $id) { habitId } }',
        { id: h1.id },
      );
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myHabitStats as Array<{ habitId: string }>;
      expect(stats).toHaveLength(1);
      expect(stats[0]?.habitId).toBe(h1.id);
    });

    it('respects startDate/endDate filters for completions', async () => {
      const { id: userId } = await seedUser(
        db,
        'habitstats-datefilter@example.com',
      );
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id);
      await db
        .insert(habitCompletions)
        .values({ habitId: habit.id, completedAt: new Date('2020-01-01') });

      const result = await gql(
        testSchema,
        db,
        userId,
        'query($s: String, $e: String) { myHabitStats(startDate: $s, endDate: $e) { totalCompletions } }',
        { s: '2025-01-01', e: '2025-12-31' },
      );
      expect(result.errors).toBeUndefined();
      const stats = result.data?.myHabitStats as Array<{
        totalCompletions: number;
      }>;
      expect(stats[0]?.totalCompletions).toBe(0);
    });
  });

  // ─── myHabitDetail ────────────────────────────────────────────────────────────

  describe('myHabitDetail', () => {
    const DETAIL_QUERY = `
      query($id: ID!, $periods: Int) {
        myHabitDetail(habitId: $id, periods: $periods) {
          habitId title totalCompletions allTimeRate
          periods { label completions target rate }
          activityType { id name }
        }
      }
    `;

    it('throws when habit not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'habitdetail-notfound@example.com',
      );
      const result = await gql(testSchema, db, userId, DETAIL_QUERY, {
        id: '00000000-0000-0000-0000-000000000000',
      });
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when habit belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'habitdetail-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'habitdetail-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherHabit = await seedHabit(db, otherId, otherAt.id);

      const result = await gql(testSchema, db, userId, DETAIL_QUERY, {
        id: otherHabit.id,
      });
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });

    it('returns weekly period breakdown with completions', async () => {
      const { id: userId } = await seedUser(
        db,
        'habitdetail-weekly@example.com',
      );
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id, {
        frequencyUnit: 'week',
        frequencyCount: 3,
      });
      await db
        .insert(habitCompletions)
        .values({ habitId: habit.id, completedAt: new Date() });

      const result = await gql(testSchema, db, userId, DETAIL_QUERY, {
        id: habit.id,
        periods: 4,
      });
      expect(result.errors).toBeUndefined();
      const detail = result.data?.myHabitDetail as {
        totalCompletions: number;
        periods: unknown[];
      };
      expect(detail.totalCompletions).toBe(1);
      expect(detail.periods).toHaveLength(4);
    });

    it('returns monthly period breakdown', async () => {
      const { id: userId } = await seedUser(
        db,
        'habitdetail-monthly@example.com',
      );
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id, {
        frequencyUnit: 'month',
        frequencyCount: 8,
      });

      const result = await gql(testSchema, db, userId, DETAIL_QUERY, {
        id: habit.id,
        periods: 3,
      });
      expect(result.errors).toBeUndefined();
      const detail = result.data?.myHabitDetail as {
        periods: Array<{ target: number }>;
      };
      expect(detail.periods).toHaveLength(3);
      expect(detail.periods[0]?.target).toBe(8);
    });

    it('clamps periods to maximum of 26', async () => {
      const { id: userId } = await seedUser(
        db,
        'habitdetail-clamp@example.com',
      );
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id);

      const result = await gql(testSchema, db, userId, DETAIL_QUERY, {
        id: habit.id,
        periods: 999,
      });
      expect(result.errors).toBeUndefined();
      const detail = result.data?.myHabitDetail as { periods: unknown[] };
      expect(detail.periods).toHaveLength(26);
    });

    it('includes activityType when present', async () => {
      const { id: userId } = await seedUser(db, 'habitdetail-at@example.com');
      const at = await seedActivityType(db, userId, 'Focus');
      const habit = await seedHabit(db, userId, at.id);

      const result = await gql(testSchema, db, userId, DETAIL_QUERY, {
        id: habit.id,
      });
      expect(result.errors).toBeUndefined();
      const detail = result.data?.myHabitDetail as {
        activityType: { name: string } | null;
      };
      expect(detail.activityType?.name).toBe('Focus');
    });
  });

  // ─── myCreateHabit ────────────────────────────────────────────────────────────

  describe('myCreateHabit', () => {
    it('throws when not authenticated', async () => {
      const { id: userId } = await seedUser(
        db,
        'create-habit-seed@example.com',
      );
      const at = await seedActivityType(db, userId);
      const result = await gql(
        testSchema,
        db,
        '',
        'mutation($input: CreateHabitArgs!) { myCreateHabit(input: $input) { id } }',
        {
          input: {
            title: 'X',
            activityTypeId: at.id,
            frequencyCount: 3,
            frequencyUnit: 'week',
            estimatedLength: 30,
          },
        },
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('creates a habit and returns it', async () => {
      const { id: userId } = await seedUser(db, 'create-habit@example.com');
      const at = await seedActivityType(db, userId);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateHabitArgs!) { myCreateHabit(input: $input) { id title frequencyCount frequencyUnit } }',
        {
          input: {
            title: 'Daily walk',
            activityTypeId: at.id,
            frequencyCount: 5,
            frequencyUnit: 'week',
            estimatedLength: 30,
          },
        },
      );
      expect(result.errors).toBeUndefined();
      const habit = result.data?.myCreateHabit as {
        title: string;
        frequencyCount: number;
      };
      expect(habit.title).toBe('Daily walk');
      expect(habit.frequencyCount).toBe(5);
    });

    it('creates a habit when pomodoro is disabled (null pomodoro fields)', async () => {
      const { id: userId } = await seedUser(
        db,
        'create-habit-nopomo@example.com',
      );
      const at = await seedActivityType(db, userId);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateHabitArgs!) { myCreateHabit(input: $input) { id pomodoroEnabled pomodoroUnitLength } }',
        {
          input: {
            title: 'No pomodoro',
            activityTypeId: at.id,
            frequencyCount: 3,
            frequencyUnit: 'week',
            estimatedLength: 30,
            pomodoroEnabled: false,
            pomodoroUnitLength: null,
            pomodoroShortBreakLength: null,
            pomodoroUnitsBeforeLongBreak: null,
            pomodoroLongBreakLength: null,
            pomodoroMaxPerDay: null,
          },
        },
      );
      expect(result.errors).toBeUndefined();
      const habit = result.data?.myCreateHabit as {
        pomodoroEnabled: boolean;
        pomodoroUnitLength: number | null;
      };
      expect(habit.pomodoroEnabled).toBe(false);
      expect(habit.pomodoroUnitLength).toBeNull();
    });
  });

  // ─── myDeleteHabit ────────────────────────────────────────────────────────────

  describe('myDeleteHabit', () => {
    it('deletes a habit and returns true', async () => {
      const { id: userId } = await seedUser(db, 'delete-habit@example.com');
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteHabit(id: $id) }',
        { id: habit.id },
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myDeleteHabit).toBe(true);
    });

    it('throws when habit not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-habit-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation { myDeleteHabit(id: "00000000-0000-0000-0000-000000000000") }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when habit belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-habit-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'delete-habit-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherHabit = await seedHabit(db, otherId, otherAt.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteHabit(id: $id) }',
        { id: otherHabit.id },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myUpdateHabit ────────────────────────────────────────────────────────────

  describe('myUpdateHabit', () => {
    it('updates habit fields', async () => {
      const { id: userId } = await seedUser(db, 'update-habit@example.com');
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id, {
        title: 'Old',
        frequencyCount: 2,
      });

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateHabitArgs!) { myUpdateHabit(input: $input) { id title frequencyCount } }',
        { input: { id: habit.id, title: 'New', frequencyCount: 5 } },
      );
      expect(result.errors).toBeUndefined();
      const updated = result.data?.myUpdateHabit as {
        title: string;
        frequencyCount: number;
      };
      expect(updated.title).toBe('New');
      expect(updated.frequencyCount).toBe(5);
    });

    it('throws when habit not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-habit-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateHabitArgs!) { myUpdateHabit(input: $input) { id } }',
        { input: { id: '00000000-0000-0000-0000-000000000000', title: 'X' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when habit belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-habit-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'update-habit-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherHabit = await seedHabit(db, otherId, otherAt.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateHabitArgs!) { myUpdateHabit(input: $input) { id } }',
        { input: { id: otherHabit.id, title: 'Hack' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myCompleteHabit ──────────────────────────────────────────────────────────

  describe('myCompleteHabit', () => {
    it('records a completion', async () => {
      const { id: userId } = await seedUser(db, 'complete-habit@example.com');
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CompleteHabitArgs!) { myCompleteHabit(input: $input) { id habitId completedAt } }',
        { input: { habitId: habit.id } },
      );
      expect(result.errors).toBeUndefined();
      const completion = result.data?.myCompleteHabit as {
        habitId: string;
        completedAt: string;
      };
      expect(completion.habitId).toBe(habit.id);
      expect(completion.completedAt).not.toBeNull();
    });

    it('records a completion with explicit scheduledAt and completedAt', async () => {
      const { id: userId } = await seedUser(
        db,
        'complete-habit-explicit@example.com',
      );
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CompleteHabitArgs!) { myCompleteHabit(input: $input) { scheduledAt completedAt } }',
        {
          input: {
            habitId: habit.id,
            scheduledAt: '2025-06-01T09:00:00',
            completedAt: '2025-06-01T10:00:00',
          },
        },
      );
      expect(result.errors).toBeUndefined();
      const c = result.data?.myCompleteHabit as { scheduledAt: string };
      expect(c.scheduledAt).not.toBeNull();
    });

    it('throws when habit not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'complete-habit-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CompleteHabitArgs!) { myCompleteHabit(input: $input) { id } }',
        { input: { habitId: '00000000-0000-0000-0000-000000000000' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when habit belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'complete-habit-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'complete-habit-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherHabit = await seedHabit(db, otherId, otherAt.id);

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CompleteHabitArgs!) { myCompleteHabit(input: $input) { id } }',
        { input: { habitId: otherHabit.id } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myUncompleteHabit ────────────────────────────────────────────────────────

  describe('myUncompleteHabit', () => {
    it('deletes the completion and returns true', async () => {
      const { id: userId } = await seedUser(db, 'uncomplete-habit@example.com');
      const at = await seedActivityType(db, userId);
      const habit = await seedHabit(db, userId, at.id);
      const [completion] = await db
        .insert(habitCompletions)
        .values({ habitId: habit.id, completedAt: new Date() })
        .returning();
      if (!completion) throw new Error('seed failed');

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myUncompleteHabit(completionId: $id) }',
        { id: completion.id },
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myUncompleteHabit).toBe(true);
    });

    it('throws when completion not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'uncomplete-habit-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation { myUncompleteHabit(completionId: "00000000-0000-0000-0000-000000000000") }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it("throws Forbidden when completion belongs to another user's habit", async () => {
      const { id: userId } = await seedUser(
        db,
        'uncomplete-habit-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'uncomplete-habit-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId);
      const otherHabit = await seedHabit(db, otherId, otherAt.id);
      const [completion] = await db
        .insert(habitCompletions)
        .values({ habitId: otherHabit.id, completedAt: new Date() })
        .returning();
      if (!completion) throw new Error('seed failed');

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myUncompleteHabit(completionId: $id) }',
        { id: completion.id },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });
});
