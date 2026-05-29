import {
  type ActivityType,
  type Habit,
  type Todo,
  type TodoList,
  activityTypes,
} from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import type { GraphQLObjectType } from 'graphql';
import type { Context } from '../../context.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import {
  CreateActivityTypeInput,
  UpdateActivityTypeInput,
} from '../validators.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

export function applyActivityTypeResolvers(
  queryFields: Fields,
  mutationFields: Fields,
): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myActivityTypes!.resolve = async (
    _parent,
    _args,
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    return context.db.query.activityTypes.findMany({
      where: { userId: context.userId },
      orderBy: { name: 'asc' },
    });
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myActivityTypeStats!.resolve = async (
    _parent,
    args: { startDate?: string; endDate?: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');

    const start = args.startDate ? new Date(args.startDate) : null;
    const end = args.endDate ? new Date(args.endDate) : null;

    const [userActivityTypes, allTodos, allTodoLists, allHabits]: [
      ActivityType[],
      Todo[],
      TodoList[],
      Habit[],
    ] = await Promise.all([
      context.db.query.activityTypes.findMany({
        where: { userId: context.userId },
      }),
      context.db.query.todos.findMany({
        where: { userId: context.userId },
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
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCreateActivityType!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = CreateActivityTypeInput.parse(args.input);
    const [activityType] = await context.db
      .insert(activityTypes)
      .values({ userId: context.userId, name: input.name, color: input.color })
      .returning();
    if (!activityType) throw new Error('Failed to create activity type');
    return activityType;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUpdateActivityType!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = UpdateActivityTypeInput.parse(args.input);
    const existing = await context.db.query.activityTypes.findFirst({
      where: { id: input.id },
    });
    if (!existing) throw new Error(`ActivityType ${input.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');
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
    return updated;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myDeleteActivityType!.resolve = async (
    _parent,
    args: { id: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const existing = await context.db.query.activityTypes.findFirst({
      where: { id: args.id },
    });
    if (!existing) throw new Error(`ActivityType ${args.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');
    await context.db.delete(activityTypes).where(eq(activityTypes.id, args.id));
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    return true;
  };
}
