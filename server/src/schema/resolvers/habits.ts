import {
  type ActivityType,
  type Habit,
  type HabitCompletion,
  habitCompletions,
  habits,
} from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import {
  badUserInput,
  forbidden,
  notFound,
  requireUser,
} from '../../errors.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import { startOfISOWeek, startOfLocalMonth } from '../../services/scheduler.ts';
import {
  CompleteHabitInput,
  CreateHabitInput,
  SkipHabitInput,
  UpdateHabitInput,
} from '../validators.ts';
import { loadOwned } from './load.ts';
import { publishDataChanged } from './subscriptions.ts';
import type { MutationMap, QueryMap } from './types.ts';

/** How many instances of one habit may be declined in a single period. */
export const MAX_SKIPS_PER_PERIOD = 2;

/**
 * The [start, end) of the frequency period `at` falls in — the same ISO week /
 * local month the scheduler counts habit instances over.
 */
function habitPeriodBounds(unit: string, at: Date): { start: Date; end: Date } {
  if (unit === 'week') {
    const start = startOfISOWeek(at);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }
  const start = startOfLocalMonth(at);
  return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) };
}

function countBy(rows: HabitCompletion[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.habitId, (counts.get(row.habitId) ?? 0) + 1);
  }
  return counts;
}

export const habitQueries: QueryMap<'myHabitStats' | 'myHabitDetail'> = {
  myHabitStats: async (_parent, args, context) => {
    const userId = requireUser(context);

    const habitWhere: Record<string, unknown> = { userId };
    if (args.habitId) habitWhere.id = args.habitId;
    const userHabits: Habit[] = await context.db.query.habits.findMany({
      where: habitWhere,
    });

    if (userHabits.length === 0) return [];

    const completedAtFilter: Record<string, unknown> = { isNotNull: true };
    if (args.startDate) completedAtFilter.gte = new Date(args.startDate);
    if (args.endDate) completedAtFilter.lte = new Date(args.endDate);

    // A skip is dated by the slot it declined, so it is filtered on
    // `scheduledAt` where a completion is filtered on `completedAt`.
    const skippedAtFilter: Record<string, unknown> = { isNotNull: true };
    if (args.startDate) skippedAtFilter.gte = new Date(args.startDate);
    if (args.endDate) skippedAtFilter.lte = new Date(args.endDate);

    const habitIds = userHabits.map((h) => h.id);
    const [allCompletions, allSkips]: [HabitCompletion[], HabitCompletion[]] =
      await Promise.all([
        context.db.query.habitCompletions.findMany({
          where: {
            habitId: { in: habitIds },
            skipped: false,
            completedAt: completedAtFilter,
          },
        }),
        context.db.query.habitCompletions.findMany({
          where: {
            habitId: { in: habitIds },
            skipped: true,
            scheduledAt: skippedAtFilter,
          },
        }),
      ]);

    const completionsByHabit = countBy(allCompletions);
    const skipsByHabit = countBy(allSkips);

    return userHabits.map((habit) => {
      const totalCompletions = completionsByHabit.get(habit.id) ?? 0;
      const totalSkipped = skipsByHabit.get(habit.id) ?? 0;
      return {
        habitId: habit.id,
        title: habit.title,
        // Skips come off the denominator rather than counting as misses: an
        // instance the user declined was never owed.
        completionRate:
          totalCompletions / Math.max(habit.frequencyCount - totalSkipped, 1),
        totalCompletions,
        totalSkipped,
      };
    });
  },

  myHabitDetail: async (_parent, args, context) => {
    const userId = requireUser(context);

    const habit = await loadOwned(context, 'habits', args.habitId, userId);

    const activityType: ActivityType | undefined =
      await context.db.query.activityTypes.findFirst({
        where: { id: habit.activityTypeId },
      });

    const numPeriods = Math.min(Math.max(args.periods ?? 8, 1), 26);
    const now = new Date();
    const isWeekly = habit.frequencyUnit === 'week';

    function getPeriodBounds(index: number): {
      start: Date;
      end: Date;
      label: string;
    } {
      if (isWeekly) {
        const weekStart = startOfISOWeek(now);
        const start = new Date(weekStart);
        start.setDate(start.getDate() - index * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const label =
          index === 0
            ? 'This week'
            : index === 1
              ? 'Last week'
              : `${index}w ago`;
        return { start, end, label };
      }
      const year = now.getFullYear();
      const month = now.getMonth();
      const targetMonth = month - index;
      const start = new Date(year, targetMonth, 1);
      const end = new Date(year, targetMonth + 1, 1);
      const label = start.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
      return { start, end, label };
    }

    const [allCompletions, allSkips]: [HabitCompletion[], HabitCompletion[]] =
      await Promise.all([
        context.db.query.habitCompletions.findMany({
          where: {
            habitId: args.habitId,
            skipped: false,
            completedAt: { isNotNull: true },
          },
        }),
        context.db.query.habitCompletions.findMany({
          where: { habitId: args.habitId, skipped: true },
        }),
      ]);

    const totalCompletions = allCompletions.length;
    const totalSkipped = allSkips.length;
    const allTimeRate =
      totalCompletions / Math.max(habit.frequencyCount - totalSkipped, 1);

    const periods = Array.from({ length: numPeriods }, (_, i) => {
      const { start, end, label } = getPeriodBounds(i);
      const count = allCompletions.filter((c) => {
        if (!c.completedAt) return false;
        return c.completedAt >= start && c.completedAt < end;
      }).length;
      const skipped = allSkips.filter((c) => {
        if (!c.scheduledAt) return false;
        return c.scheduledAt >= start && c.scheduledAt < end;
      }).length;
      // Skips reduce what the period asked for. A period skipped down to
      // nothing owed reads as 1, not as a division by zero.
      const effectiveTarget = Math.max(habit.frequencyCount - skipped, 0);
      return {
        label,
        periodStart: start.toISOString().replace('Z', ''),
        periodEnd: end.toISOString().replace('Z', ''),
        completions: count,
        skipped,
        target: habit.frequencyCount,
        effectiveTarget,
        rate: effectiveTarget === 0 ? 1 : count / effectiveTarget,
      };
    }).reverse();

    return {
      habitId: habit.id,
      title: habit.title,
      description: habit.description ?? null,
      priority: habit.priority,
      estimatedLength: habit.estimatedLength,
      frequencyCount: habit.frequencyCount,
      frequencyUnit: habit.frequencyUnit,
      activityType: activityType ?? null,
      totalCompletions,
      totalSkipped,
      allTimeRate,
      periods,
    };
  },
};

/**
 * `habit_completions` owns no `userId` — it is owned through its habit — so it
 * cannot go through `loadOwned`. Same guard order all the same.
 */
async function loadCompletion(
  context: Parameters<typeof loadOwned>[0],
  completionId: string,
  userId: string,
): Promise<HabitCompletion> {
  const completion: HabitCompletion | undefined =
    await context.db.query.habitCompletions.findFirst({
      where: { id: completionId },
    });
  if (!completion) throw notFound('Habit completion', completionId);
  const habit: Habit | undefined = await context.db.query.habits.findFirst({
    where: { id: completion.habitId },
  });
  if (!habit) throw new Error('Underlying habit not found');
  if (habit.userId !== userId) throw forbidden();
  return completion;
}

export const habitMutations: MutationMap<
  | 'myCreateHabit'
  | 'myDeleteHabit'
  | 'myUpdateHabit'
  | 'myCompleteHabit'
  | 'myUncompleteHabit'
  | 'mySkipHabit'
  | 'myUnskipHabit'
> = {
  myCreateHabit: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = CreateHabitInput.parse(args.input);
    const [habit] = await context.db
      .insert(habits)
      .values({
        userId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        estimatedLength: input.estimatedLength ?? 0,
        activityTypeId: input.activityTypeId,
        frequencyCount: input.frequencyCount,
        frequencyUnit: input.frequencyUnit,
        minTimeBetweenInstances: input.minTimeBetweenInstances ?? null,
        pomodoroEnabled: input.pomodoroEnabled ?? false,
        pomodoroUnitLength: input.pomodoroUnitLength ?? null,
        pomodoroShortBreakLength: input.pomodoroShortBreakLength ?? null,
        pomodoroUnitsBeforeLongBreak:
          input.pomodoroUnitsBeforeLongBreak ?? null,
        pomodoroLongBreakLength: input.pomodoroLongBreakLength ?? null,
        pomodoroMaxPerDay: input.pomodoroMaxPerDay ?? null,
      })
      .returning();
    if (!habit) throw new Error('Failed to create habit');
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'habit', [habit.id]);
    return habit;
  },

  myDeleteHabit: async (_parent, args, context) => {
    const userId = requireUser(context);
    await loadOwned(context, 'habits', args.id, userId);
    await context.db.delete(habits).where(eq(habits.id, args.id));
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'habit', [args.id]);
    return true;
  },

  myUpdateHabit: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = UpdateHabitInput.parse(args.input);
    await loadOwned(context, 'habits', input.id, userId);
    const [updated] = await context.db
      .update(habits)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.estimatedLength !== undefined && {
          estimatedLength: input.estimatedLength,
        }),
        ...(input.activityTypeId !== undefined && {
          activityTypeId: input.activityTypeId,
        }),
        ...(input.frequencyCount !== undefined && {
          frequencyCount: input.frequencyCount,
        }),
        ...(input.frequencyUnit !== undefined && {
          frequencyUnit: input.frequencyUnit,
        }),
        ...(input.minTimeBetweenInstances !== undefined && {
          minTimeBetweenInstances: input.minTimeBetweenInstances,
        }),
        ...(input.pomodoroEnabled !== undefined && {
          pomodoroEnabled: input.pomodoroEnabled,
        }),
        ...(input.pomodoroUnitLength !== undefined && {
          pomodoroUnitLength: input.pomodoroUnitLength,
        }),
        ...(input.pomodoroShortBreakLength !== undefined && {
          pomodoroShortBreakLength: input.pomodoroShortBreakLength,
        }),
        ...(input.pomodoroUnitsBeforeLongBreak !== undefined && {
          pomodoroUnitsBeforeLongBreak: input.pomodoroUnitsBeforeLongBreak,
        }),
        ...(input.pomodoroLongBreakLength !== undefined && {
          pomodoroLongBreakLength: input.pomodoroLongBreakLength,
        }),
        ...(input.pomodoroMaxPerDay !== undefined && {
          pomodoroMaxPerDay: input.pomodoroMaxPerDay,
        }),
        updatedAt: new Date(),
      })
      .where(eq(habits.id, input.id))
      .returning();
    if (!updated) throw new Error(`Failed to update habit ${input.id}`);
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'habit', [updated.id]);
    return updated;
  },

  myCompleteHabit: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = CompleteHabitInput.parse(args.input);
    await loadOwned(context, 'habits', input.habitId, userId);
    const [completion] = await context.db
      .insert(habitCompletions)
      .values({
        habitId: input.habitId,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        completedAt: input.completedAt
          ? new Date(input.completedAt)
          : new Date(),
      })
      .returning();
    if (!completion) throw new Error('Failed to record habit completion');
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'habit', [input.habitId]);
    return completion;
  },

  // Declining one instance. The row is a `habit_completions` row with
  // `completedAt` still null and `skipped` set — so it never reads as a
  // completion, but it survives the writeback's sweep of tentative rows and
  // counts toward the period, which is what stops the scheduler from simply
  // re-placing what the user just declined.
  mySkipHabit: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = SkipHabitInput.parse(args.input);
    const habit = await loadOwned(context, 'habits', input.habitId, userId);

    const slot = input.scheduledAt ? new Date(input.scheduledAt) : new Date();
    const { start, end } = habitPeriodBounds(habit.frequencyUnit, slot);

    const existing: HabitCompletion[] =
      await context.db.query.habitCompletions.findMany({
        where: {
          habitId: habit.id,
          skipped: true,
          scheduledAt: { gte: start, lt: end },
        },
      });
    // Capped so the metric stays worth reading: a habit that can be skipped
    // without limit has no completion rate to speak of.
    if (existing.length >= MAX_SKIPS_PER_PERIOD) {
      throw badUserInput(
        `Already skipped ${existing.length} of this habit this ${habit.frequencyUnit}. The limit is ${MAX_SKIPS_PER_PERIOD}.`,
        { habitId: habit.id, limit: MAX_SKIPS_PER_PERIOD },
      );
    }

    const [skip] = await context.db
      .insert(habitCompletions)
      .values({ habitId: habit.id, scheduledAt: slot, skipped: true })
      .returning();
    if (!skip) throw new Error('Failed to record habit skip');
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'habit', [habit.id]);
    return skip;
  },

  myUnskipHabit: async (_parent, args, context) => {
    const userId = requireUser(context);
    const skip = await loadCompletion(context, args.completionId, userId);
    if (!skip.skipped) {
      throw badUserInput(
        `Habit completion ${args.completionId} is not a skip`,
        { completionId: args.completionId },
      );
    }
    await context.db
      .delete(habitCompletions)
      .where(eq(habitCompletions.id, args.completionId));
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'habit', [skip.habitId]);
    return true;
  },

  myUncompleteHabit: async (_parent, args, context) => {
    const userId = requireUser(context);
    const completion = await loadCompletion(context, args.completionId, userId);
    // A skip is not a completion; `myUnskipHabit` is its counterpart. Letting
    // this delete one would make "undo" ambiguous on a row that shows as
    // skipped in the UI.
    if (completion.skipped) {
      throw badUserInput(
        `Habit completion ${args.completionId} is a skip — use myUnskipHabit`,
        { completionId: args.completionId },
      );
    }
    await context.db
      .delete(habitCompletions)
      .where(eq(habitCompletions.id, args.completionId));
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'habit', [completion.habitId]);
    return true;
  },
};
