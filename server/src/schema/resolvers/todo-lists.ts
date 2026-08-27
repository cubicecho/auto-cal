import { todoLists } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import {
  forbidden,
  notFound,
  requireOwner,
  requireUser,
} from '../../errors.ts';
import { CreateTodoListInput, UpdateTodoListInput } from '../validators.ts';
import { publishTodoListEvent } from './subscriptions.ts';
import type { MutationMap } from './types.ts';

export const todoListMutations: MutationMap<
  'myCreateTodoList' | 'myUpdateTodoList' | 'myDeleteTodoList'
> = {
  myCreateTodoList: async (_parent, args, context) => {
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
    publishTodoListEvent(userId, { type: 'created', entity: list });
    return list;
  },

  myUpdateTodoList: async (_parent, args, context) => {
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
    publishTodoListEvent(userId, { type: 'updated', entity: updated });
    return updated;
  },

  myDeleteTodoList: async (_parent, args, context) => {
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
    publishTodoListEvent(userId, { type: 'deleted', deletedId: args.id });
    return true;
  },
};
