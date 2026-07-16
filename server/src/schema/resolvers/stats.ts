import type {
  ActivityType,
  Habit,
  HabitCompletion,
  Todo,
} from '@auto-cal/db/schema';
import type { GraphQLObjectType } from 'graphql';
import type { Context } from '../../context.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

export function applyStatsResolvers(queryFields: Fields): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myStats!.resolve = async (
    _parent,
    args: { startDate?: string; endDate?: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');

    const now = new Date();
    const start = args.startDate ? new Date(args.startDate) : null;
    const end = args.endDate ? new Date(args.endDate) : now;

    const scheduledAtFilter: Record<string, unknown> = {
      isNotNull: true,
      lte: end,
    };
    if (start) scheduledAtFilter.gte = start;

    const [userHabits, todosInRange, userActivityTypes]: [
      Habit[],
      Todo[],
      ActivityType[],
    ] = await Promise.all([
      context.db.query.habits.findMany({
        where: { userId: context.userId },
      }),
      context.db.query.todos.findMany({
        where: { userId: context.userId, scheduledAt: scheduledAtFilter },
      }),
      context.db.query.activityTypes.findMany({
        where: { userId: context.userId },
      }),
    ]);

    const activityTypeMap = new Map<string, ActivityType>(
      userActivityTypes.map((at) => [at.id, at]),
    );

    const completionsByHabit = new Map<string, number>();
    if (userHabits.length > 0) {
      const completedAtFilter: Record<string, unknown> = {
        isNotNull: true,
        lte: end,
      };
      if (start) completedAtFilter.gte = start;
      const allHabitCompletions: HabitCompletion[] =
        await context.db.query.habitCompletions.findMany({
          where: {
            habitId: { in: userHabits.map((h) => h.id) },
            completedAt: completedAtFilter,
          },
        });
      for (const c of allHabitCompletions) {
        completionsByHabit.set(
          c.habitId,
          (completionsByHabit.get(c.habitId) ?? 0) + 1,
        );
      }
    }

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const habitSummaries = userHabits.map((habit) => {
      const completions = completionsByHabit.get(habit.id) ?? 0;
      const effectiveStart = start ?? habit.createdAt;
      const periodDays = habit.frequencyUnit === 'week' ? 7 : 365.25 / 12;
      const rangeMs = Math.max(end.getTime() - effectiveStart.getTime(), 0);
      const periods = rangeMs / (periodDays * MS_PER_DAY);
      const target = periods * habit.frequencyCount;
      const rate = target > 0 ? Math.min(1.0, completions / target) : 1.0;
      return {
        habitId: habit.id,
        title: habit.title,
        completionRate: rate,
        completions,
        target,
        frequencyUnit: habit.frequencyUnit,
        frequencyCount: habit.frequencyCount,
        activityType: habit.activityTypeId
          ? (activityTypeMap.get(habit.activityTypeId) ?? null)
          : null,
      };
    });

    const habitScore =
      habitSummaries.length > 0
        ? habitSummaries.reduce((sum, h) => sum + h.completionRate, 0) /
          habitSummaries.length
        : null;

    const totalTodos = todosInRange.length;
    const completedTodos = todosInRange.filter(
      (t) => t.completedAt !== null,
    ).length;
    const overdueTodos = todosInRange.filter(
      (t) =>
        t.completedAt === null && t.scheduledAt !== null && t.scheduledAt < now,
    ).length;
    const todoScore = totalTodos > 0 ? completedTodos / totalTodos : null;

    const weightedScore =
      habitScore !== null && todoScore !== null
        ? (habitScore + todoScore) / 2
        : (habitScore ?? todoScore ?? null);

    return {
      weightedScore,
      habitScore,
      todoScore,
      habits: habitSummaries,
      todos: {
        total: totalTodos,
        completed: completedTodos,
        overdue: overdueTodos,
        completionRate: todoScore ?? 0,
      },
    };
  };
}
