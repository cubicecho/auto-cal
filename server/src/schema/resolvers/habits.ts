import {
  type ActivityType,
  type Habit,
  type HabitCompletion,
  habitCompletions,
  habits,
} from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import { forbidden, notFound, requireUser } from '../../errors.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import { startOfISOWeek } from '../../services/scheduler.ts';
import {
  CompleteHabitInput,
  CreateHabitInput,
  UpdateHabitInput,
} from '../validators.ts';
import { loadOwned } from './load.ts';
import { publishDataChanged } from './subscriptions.ts';
import type { MutationMap, QueryMap } from './types.ts';

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

    const allCompletions: HabitCompletion[] =
      await context.db.query.habitCompletions.findMany({
        where: {
          habitId: { in: userHabits.map((h) => h.id) },
          completedAt: completedAtFilter,
        },
      });

    const completionsByHabit = new Map<string, number>();
    for (const c of allCompletions) {
      completionsByHabit.set(
        c.habitId,
        (completionsByHabit.get(c.habitId) ?? 0) + 1,
      );
    }

    return userHabits.map((habit) => {
      const totalCompletions = completionsByHabit.get(habit.id) ?? 0;
      return {
        habitId: habit.id,
        title: habit.title,
        completionRate: totalCompletions / habit.frequencyCount,
        totalCompletions,
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

    const allCompletions: HabitCompletion[] =
      await context.db.query.habitCompletions.findMany({
        where: {
          habitId: args.habitId,
          completedAt: { isNotNull: true },
        },
      });

    const totalCompletions = allCompletions.length;
    const allTimeRate = totalCompletions / habit.frequencyCount;

    const periods = Array.from({ length: numPeriods }, (_, i) => {
      const { start, end, label } = getPeriodBounds(i);
      const count = allCompletions.filter((c) => {
        if (!c.completedAt) return false;
        return c.completedAt >= start && c.completedAt < end;
      }).length;
      return {
        label,
        periodStart: start.toISOString().replace('Z', ''),
        periodEnd: end.toISOString().replace('Z', ''),
        completions: count,
        target: habit.frequencyCount,
        rate: count / habit.frequencyCount,
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
      allTimeRate,
      periods,
    };
  },
};

export const habitMutations: MutationMap<
  | 'myCreateHabit'
  | 'myDeleteHabit'
  | 'myUpdateHabit'
  | 'myCompleteHabit'
  | 'myUncompleteHabit'
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

  myUncompleteHabit: async (_parent, args, context) => {
    const userId = requireUser(context);
    // Look up the completion + its habit to enforce ownership
    const completion = await context.db.query.habitCompletions.findFirst({
      where: { id: args.completionId },
    });
    if (!completion) {
      throw notFound('Habit completion', args.completionId);
    }
    const habit = await context.db.query.habits.findFirst({
      where: { id: completion.habitId },
    });
    if (!habit) throw new Error('Underlying habit not found');
    if (habit.userId !== userId) throw forbidden();
    await context.db
      .delete(habitCompletions)
      .where(eq(habitCompletions.id, args.completionId));
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'habit', [completion.habitId]);
    return true;
  },
};
