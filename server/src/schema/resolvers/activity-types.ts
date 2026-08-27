import {
  type ActivityType,
  type Habit,
  type Todo,
  type TodoList,
  activityTypes,
} from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '../../errors.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import {
  CreateActivityTypeInput,
  UpdateActivityTypeInput,
} from '../validators.ts';
import { loadOwned } from './load.ts';
import { publishDataChanged } from './subscriptions.ts';
import type { FieldMap, MutationMap, QueryMap } from './types.ts';

export const activityTypeQueries: QueryMap<'myActivityTypeStats'> = {
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
        where: { userId },
      }),
      context.db.query.todos.findMany({
        where: { userId },
      }),
      context.db.query.todoLists.findMany({
        where: { userId },
      }),
      context.db.query.habits.findMany({
        where: {
          userId,
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
      .values({ userId, name: input.name, color: input.color })
      .returning();
    if (!activityType) throw new Error('Failed to create activity type');
    publishDataChanged(userId, 'activityType', [activityType.id]);
    return activityType;
  },

  myUpdateActivityType: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = UpdateActivityTypeInput.parse(args.input);
    await loadOwned(context, 'activityTypes', input.id, userId);
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
    await loadOwned(context, 'activityTypes', args.id, userId);
    await context.db.delete(activityTypes).where(eq(activityTypes.id, args.id));
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'activityType', [args.id]);
    return true;
  },
};

/**
 * The activity-type tree. Neither link is a Drizzle relation drizzle-graphql
 * can generate a resolver for: `parent` is a self-reference the SDL declares,
 * and `children` is its inverse.
 */
export const activityTypeFields: FieldMap<
  'ActivityType',
  'parent' | 'children'
> = {
  parent: (parent, _args, context) =>
    parent.parentId ? context.loaders.activityType.load(parent.parentId) : null,

  children: (parent, _args, context) =>
    context.loaders.activityTypeByParent.load(parent.id),
};
