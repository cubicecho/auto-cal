import { todoLists } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import type { GraphQLObjectType } from 'graphql';
import type { Context } from '../../context.ts';
import {
  forbidden,
  notFound,
  requireOwner,
  requireUser,
} from '../../errors.ts';
import { pubsub } from '../../pubsub.ts';
import { CreateTodoListInput, UpdateTodoListInput } from '../validators.ts';
import { TODO_LIST_EVENT } from './subscriptions.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

export function applyTodoListResolvers(
  queryFields: Fields,
  mutationFields: Fields,
): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myTodoLists!.resolve = async (
    _parent,
    _args,
    context: Context,
  ) => {
    const userId = requireUser(context);
    return context.db.query.todoLists.findMany({
      where: { userId: userId },
      orderBy: { name: 'asc' },
    });
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCreateTodoList!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    const userId = requireUser(context);
    const input = CreateTodoListInput.parse(args.input);

    // Validate activity type belongs to the user
    const activityType = await context.db.query.activityTypes.findFirst({
      where: { id: input.activityTypeId },
    });
    if (!activityType) {
      throw notFound('ActivityType', input.activityTypeId);
    }
    if (activityType.userId !== userId) {
      throw forbidden();
    }

    const [list] = await context.db
      .insert(todoLists)
      .values({
        userId: userId,
        name: input.name,
        description: input.description,
        activityTypeId: input.activityTypeId,
        defaultPriority: input.defaultPriority,
        defaultEstimatedLength: input.defaultEstimatedLength,
      })
      .returning();
    if (!list) throw new Error('Failed to create todo list');
    pubsub
      .publish(TODO_LIST_EVENT(userId), {
        type: 'created',
        todoList: list,
      })
      .catch(console.error);
    return list;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUpdateTodoList!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    const userId = requireUser(context);
    const input = UpdateTodoListInput.parse(args.input);
    requireOwner(
      await context.db.query.todoLists.findFirst({
        where: { id: input.id },
      }),
      'TodoList',
      input.id,
      userId,
    );

    if (input.activityTypeId !== undefined) {
      requireOwner(
        await context.db.query.activityTypes.findFirst({
          where: { id: input.activityTypeId },
        }),
        'ActivityType',
        input.activityTypeId,
        userId,
      );
    }

    const [updated] = await context.db
      .update(todoLists)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.activityTypeId !== undefined && {
          activityTypeId: input.activityTypeId,
        }),
        ...(input.defaultPriority !== undefined && {
          defaultPriority: input.defaultPriority,
        }),
        ...(input.defaultEstimatedLength !== undefined && {
          defaultEstimatedLength: input.defaultEstimatedLength,
        }),
        updatedAt: new Date(),
      })
      .where(eq(todoLists.id, input.id))
      .returning();
    if (!updated) throw new Error(`Failed to update todo list ${input.id}`);
    pubsub
      .publish(TODO_LIST_EVENT(userId), {
        type: 'updated',
        todoList: updated,
      })
      .catch(console.error);
    return updated;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myDeleteTodoList!.resolve = async (
    _parent,
    args: { id: string },
    context: Context,
  ) => {
    const userId = requireUser(context);
    requireOwner(
      await context.db.query.todoLists.findFirst({
        where: { id: args.id },
      }),
      'TodoList',
      args.id,
      userId,
    );

    // Block delete when the list still has todos — todos.list_id is RESTRICT.
    const todoCount = await context.db.query.todos.findMany({
      where: { listId: args.id },
      limit: 1,
    });
    if (todoCount.length > 0) {
      throw new Error(
        'Cannot delete a list that still contains todos. Move or delete its todos first.',
      );
    }

    await context.db.delete(todoLists).where(eq(todoLists.id, args.id));
    pubsub
      .publish(TODO_LIST_EVENT(userId), {
        type: 'deleted',
        deletedId: args.id,
      })
      .catch(console.error);
    return true;
  };
}
