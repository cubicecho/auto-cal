import {
  type ActivityType,
  type Habit,
  type HabitCompletion,
  habitCompletions,
  habits,
} from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import type { GraphQLObjectType } from 'graphql';
import { z } from 'zod';
import type { Context } from '../../context.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import { startOfISOWeek } from '../../services/scheduler.ts';
import { CompleteHabitInput, CreateHabitInput } from '../validators.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

const UpdateHabitInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  estimatedLength: z.number().int().min(1).max(1440).optional(),
  activityTypeId: z.string().uuid().optional(),
  frequencyCount: z.number().int().positive().min(1).max(30).optional(),
  frequencyUnit: z.enum(['week', 'month'] as const).optional(),
  minTimeBetweenInstances: z.number().int().min(0).nullable().optional(),
  pomodoroEnabled: z.boolean().optional(),
  pomodoroUnitLength: z.number().int().min(1).max(120).nullable().optional(),
  pomodoroShortBreakLength: z
    .number()
    .int()
    .min(1)
    .max(60)
    .nullable()
    .optional(),
  pomodoroUnitsBeforeLongBreak: z
    .number()
    .int()
    .min(1)
    .max(20)
    .nullable()
    .optional(),
  pomodoroLongBreakLength: z
    .number()
    .int()
    .min(1)
    .max(120)
    .nullable()
    .optional(),
  pomodoroMaxPerDay: z.number().int().min(1).max(100).nullable().optional(),
});

export function applyHabitResolvers(
  queryFields: Fields,
  mutationFields: Fields,
): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myHabits!.resolve = async (
    _parent,
    args: { activityTypeId?: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const where: Record<string, unknown> = { userId: context.userId };
    if (args.activityTypeId) where.activityTypeId = args.activityTypeId;
    return context.db.query.habits.findMany({
      where,
      orderBy: { priority: 'desc', createdAt: 'desc' },
    });
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myHabitStats!.resolve = async (
    _parent,
    args: { habitId?: string; startDate?: string; endDate?: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');

    const habitWhere: Record<string, unknown> = { userId: context.userId };
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
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myHabitDetail!.resolve = async (
    _parent,
    args: { habitId: string; periods?: number },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');

    const habit = await context.db.query.habits.findFirst({
      where: { id: args.habitId },
    });
    if (!habit) throw new Error(`Habit ${args.habitId} not found`);
    if (habit.userId !== context.userId) throw new Error('Forbidden');

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
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCreateHabit!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = CreateHabitInput.parse(args.input);
    const [habit] = await context.db
      .insert(habits)
      .values({
        userId: context.userId,
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
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    return habit;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myDeleteHabit!.resolve = async (
    _parent,
    args: { id: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const existing = await context.db.query.habits.findFirst({
      where: { id: args.id },
    });
    if (!existing) throw new Error(`Habit ${args.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');
    await context.db.delete(habits).where(eq(habits.id, args.id));
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    return true;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUpdateHabit!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = UpdateHabitInput.parse(args.input);
    const existing = await context.db.query.habits.findFirst({
      where: { id: input.id },
    });
    if (!existing) throw new Error(`Habit ${input.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');
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
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    return updated;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCompleteHabit!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = CompleteHabitInput.parse(args.input);
    const habit = await context.db.query.habits.findFirst({
      where: { id: input.habitId },
    });
    if (!habit) throw new Error(`Habit ${input.habitId} not found`);
    if (habit.userId !== context.userId) throw new Error('Forbidden');
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
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    return completion;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUncompleteHabit!.resolve = async (
    _parent,
    args: { completionId: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    // Look up the completion + its habit to enforce ownership
    const completion = await context.db.query.habitCompletions.findFirst({
      where: { id: args.completionId },
    });
    if (!completion) {
      throw new Error(`Habit completion ${args.completionId} not found`);
    }
    const habit = await context.db.query.habits.findFirst({
      where: { id: completion.habitId },
    });
    if (!habit) throw new Error('Underlying habit not found');
    if (habit.userId !== context.userId) throw new Error('Forbidden');
    await context.db
      .delete(habitCompletions)
      .where(eq(habitCompletions.id, args.completionId));
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    return true;
  };
}
