import {
  type ActivityType,
  type Habit,
  type Todo,
  type TodoList,
  activityTypes,
} from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import { requireOwner, requireUser } from '../../errors.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import {
  CreateActivityTypeInput,
  UpdateActivityTypeInput,
} from '../validators.ts';
import { publishDataChanged } from './subscriptions.ts';
import type { MutationMap, QueryMap } from './types.ts';

export const activityTypeQueries: QueryMap<
  'myActivityTypes' | 'myActivityTypeStats'
> = {
  myActivityTypes: async (_parent, _args, context) => {
    const userId = requireUser(context);
    return context.db.query.activityTypes.findMany({
      where: { userId: userId },
      orderBy: { name: 'asc' },
    });
  },

  myActivityTypeStats: async (_parent, args, context) => {
    const userId = requireUser(context);

    const start = args.startDate ? new Date(args.startDate) : null;
    const end = args.endDate ? new Date(args.endDate) : null;

    const [userActivityTypes, allTodos, allTodoLists, allHabits]: [
      ActivityType[],
      Todo[],
      TodoList[],
      Habit[],
    ] = await Promise.all([
      context.db.query.activityTypes.findMany({
        where: { userId: userId },
      }),
      context.db.query.todos.findMany({
        where: { userId: userId },
      }),
      context.db.query.todoLists.findMany({
        where: { userId: userId },
      }),
      context.db.query.habits.findMany({
        where: {
          userId: userId,
          activityTypeId: { isNotNull: true },
        },
      }),
    ]);

    const listActivityTypeMap = new Map(
      allTodoLists.map((l) => [l.id, l.activityTypeId]),
    );

    const todosByType = new Map<string, typeof allTodos>();
    for (const todo of allTodos) {
      const activityTypeId = listActivityTypeMap.get(todo.listId);
      if (!activityTypeId) continue;
      const bucket = todosByType.get(activityTypeId) ?? [];
      bucket.push(todo);
      todosByType.set(activityTypeId, bucket);
    }

    const habitsByType = new Map<string, number>();
    for (const habit of allHabits) {
      if (!habit.activityTypeId) continue;
      habitsByType.set(
        habit.activityTypeId,
        (habitsByType.get(habit.activityTypeId) ?? 0) + 1,
      );
    }

    return userActivityTypes.map((at) => {
      const typeTodos = todosByType.get(at.id) ?? [];
      const totalTodos = typeTodos.filter((t) => {
        const ref = t.scheduledAt ?? t.completedAt;
        if (!ref) return !start && !end;
        if (start && ref < start) return false;
        if (end && ref > end) return false;
        return true;
      }).length;
      const completedTodos = typeTodos.filter((t) => {
        if (!t.completedAt) return false;
        if (start && t.completedAt < start) return false;
        if (end && t.completedAt > end) return false;
        return true;
      }).length;
      return {
        activityTypeId: at.id,
        activityTypeName: at.name,
        totalTodos,
        completedTodos,
        totalHabits: habitsByType.get(at.id) ?? 0,
      };
    });
  },
};

export const activityTypeMutations: MutationMap<
  'myCreateActivityType' | 'myUpdateActivityType' | 'myDeleteActivityType'
> = {
  myCreateActivityType: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = CreateActivityTypeInput.parse(args.input);
    const [activityType] = await context.db
      .insert(activityTypes)
      .values({ userId: userId, name: input.name, color: input.color })
      .returning();
    if (!activityType) throw new Error('Failed to create activity type');
    publishDataChanged(userId, 'activityType', [activityType.id]);
    return activityType;
  },

  myUpdateActivityType: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = UpdateActivityTypeInput.parse(args.input);
    requireOwner(
      await context.db.query.activityTypes.findFirst({
        where: { id: input.id },
      }),
      'ActivityType',
      input.id,
      userId,
    );
    const [updated] = await context.db
      .update(activityTypes)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.color !== undefined && { color: input.color }),
        updatedAt: new Date(),
      })
      .where(eq(activityTypes.id, input.id))
      .returning();
    if (!updated) throw new Error(`Failed to update activity type ${input.id}`);
    publishDataChanged(userId, 'activityType', [updated.id]);
    return updated;
  },

  myDeleteActivityType: async (_parent, args, context) => {
    const userId = requireUser(context);
    requireOwner(
      await context.db.query.activityTypes.findFirst({
        where: { id: args.id },
      }),
      'ActivityType',
      args.id,
      userId,
    );
    await context.db.delete(activityTypes).where(eq(activityTypes.id, args.id));
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'activityType', [args.id]);
    return true;
  },
};
