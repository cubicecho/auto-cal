import {
  type ActivityType,
  type Habit,
  type HabitCompletion,
  type TimeBlock,
  type Todo,
  type TodoList,
  todos,
  users,
} from '@auto-cal/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { GraphQLObjectType } from 'graphql';
import { z } from 'zod';
import type { Context } from '../../context.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import {
  type TodoWithActivityType,
  computeSchedule,
  startOfISOWeek,
  startOfISOWeekStr,
  startOfLocalMonth,
} from '../../services/scheduler.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

export function applyScheduleResolvers(
  queryFields: Fields,
  mutationFields: Fields,
): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.mySchedule!.resolve = async (
    _parent,
    args: { weekStart?: string; timezone?: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');

    if (args.timezone) {
      context.db
        .update(users)
        .set({ timezone: args.timezone, updatedAt: new Date() })
        .where(eq(users.id, context.userId))
        .catch(console.error);
    }

    const weekStartStr = args.weekStart
      ? (() => {
          const dateStr = z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStart must be YYYY-MM-DD')
            .parse(args.weekStart);
          const parsed = new Date(`${dateStr}T00:00:00`);
          if (Number.isNaN(parsed.getTime()))
            throw new Error('Invalid weekStart date');
          return startOfISOWeekStr(parsed);
        })()
      : startOfISOWeekStr(new Date());

    const weekStart = startOfISOWeek(new Date(`${weekStartStr}T00:00:00`));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthStart = startOfLocalMonth(weekStart);
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      1,
    );

    const [
      userTimeBlocks,
      allIncompleteRawTodos,
      userCompletedRawTodos,
      userTodoLists,
      userHabits,
      userActivityTypes,
    ]: [TimeBlock[], Todo[], Todo[], TodoList[], Habit[], ActivityType[]] =
      await Promise.all([
        context.db.query.timeBlocks.findMany({
          where: { userId: context.userId },
        }),
        context.db.query.todos.findMany({
          where: {
            userId: context.userId,
            completedAt: { isNull: true },
          },
          orderBy: { priority: 'desc' },
        }),
        context.db.query.todos.findMany({
          where: {
            userId: context.userId,
            completedAt: { isNotNull: true },
          },
        }),
        context.db.query.todoLists.findMany({
          where: { userId: context.userId },
        }),
        context.db.query.habits.findMany({
          where: {
            userId: context.userId,
            activityTypeId: { isNotNull: true },
          },
        }),
        context.db.query.activityTypes.findMany({
          where: { userId: context.userId },
        }),
      ]);

    const listActivityTypeMap = new Map(
      userTodoLists.map((l) => [l.id, l.activityTypeId]),
    );

    const allIncompleteTodos: TodoWithActivityType[] =
      allIncompleteRawTodos.map((t) => ({
        ...t,
        activityTypeId: listActivityTypeMap.get(t.listId) ?? null,
      }));
    const userCompletedTodos: TodoWithActivityType[] =
      userCompletedRawTodos.map((t) => ({
        ...t,
        activityTypeId: listActivityTypeMap.get(t.listId) ?? null,
      }));

    const now = new Date();

    const overduePinnedIds = allIncompleteTodos
      .filter(
        (t) => t.manuallyScheduled && t.scheduledAt && t.scheduledAt < now,
      )
      .map((t) => t.id);

    if (overduePinnedIds.length > 0) {
      context.db
        .update(todos)
        .set({ manuallyScheduled: false, scheduledAt: null, updatedAt: now })
        .where(inArray(todos.id, overduePinnedIds))
        .catch(console.error);
    }

    const pinnedTodos = allIncompleteTodos.filter(
      (t) =>
        t.manuallyScheduled &&
        t.scheduledAt &&
        !overduePinnedIds.includes(t.id),
    );
    const userTodos = allIncompleteTodos.filter(
      (t) => !t.manuallyScheduled || overduePinnedIds.includes(t.id),
    );

    const userHabitIds = userHabits.map((h) => h.id);

    const [weekCompletions, monthCompletions]: [
      HabitCompletion[],
      HabitCompletion[],
    ] =
      userHabitIds.length === 0
        ? [[], []]
        : await Promise.all([
            context.db.query.habitCompletions.findMany({
              where: {
                habitId: { in: userHabitIds },
                completedAt: {
                  isNotNull: true,
                  gte: weekStart,
                  lte: weekEnd,
                },
              },
            }),
            context.db.query.habitCompletions.findMany({
              where: {
                habitId: { in: userHabitIds },
                completedAt: {
                  isNotNull: true,
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
            }),
          ]);

    const activityTypeMap = new Map<string, ActivityType>(
      userActivityTypes.map((at) => [at.id, at]),
    );

    const weekCompletionCounts = new Map<string, number>();
    for (const c of weekCompletions) {
      weekCompletionCounts.set(
        c.habitId,
        (weekCompletionCounts.get(c.habitId) ?? 0) + 1,
      );
    }
    const monthCompletionCounts = new Map<string, number>();
    for (const c of monthCompletions) {
      monthCompletionCounts.set(
        c.habitId,
        (monthCompletionCounts.get(c.habitId) ?? 0) + 1,
      );
    }

    const habitInstances: Array<
      (typeof userHabits)[number] & { instanceIndex: number }
    > = [];
    for (const h of userHabits) {
      if (!h.activityTypeId) continue;
      const counts =
        h.frequencyUnit === 'week'
          ? weekCompletionCounts
          : monthCompletionCounts;
      const done = counts.get(h.id) ?? 0;
      const deficit = h.frequencyCount - done;
      if (deficit <= 0) continue;
      for (let i = 0; i < deficit; i++) {
        habitInstances.push({ ...h, instanceIndex: i });
      }
    }

    const items = computeSchedule(
      weekStartStr,
      userTimeBlocks,
      userTodos,
      habitInstances,
      activityTypeMap,
      args.timezone ?? 'UTC',
    );

    const todoCompletedAtMap = new Map(
      userCompletedTodos.map((t) => [t.id, t.completedAt]),
    );

    const scheduledItems = items.map((item) => ({
      ...item,
      completedAt:
        item.kind === 'todo'
          ? (todoCompletedAtMap.get(item.id)?.toISOString() ?? null)
          : null,
    }));

    const pinnedItems = pinnedTodos.map((t) => {
      // biome-ignore lint/style/noNonNullAssertion: pinnedTodos is filtered by t.scheduledAt truthy above
      const start = t.scheduledAt!;
      const end = new Date(start.getTime() + t.estimatedLength * 60_000);
      return {
        kind: 'todo' as const,
        id: t.id,
        title: t.title,
        priority: t.priority,
        estimatedLength: t.estimatedLength,
        activityType: t.activityTypeId
          ? (activityTypeMap.get(t.activityTypeId) ?? null)
          : null,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        isScheduled: true,
        isOverdue: false,
        completedAt: null,
      };
    });

    return [...scheduledItems, ...pinnedItems];
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myReschedule!.resolve = async (
    _parent,
    _args: { weekStart?: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    await runSchedulerWriteback(context.db, context.userId);
    return true;
  };
}
