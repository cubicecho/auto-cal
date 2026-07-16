import { todos } from '@auto-cal/db/schema';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import type { GraphQLObjectType } from 'graphql';
import type { InnerOrder, TodoOrderBy } from '../../__generated__/resolvers.ts';
import type { Context } from '../../context.ts';
import { pubsub } from '../../pubsub.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import { CreateTodoInput, UpdateTodoInput } from '../validators.ts';
import { TODO_EVENT } from './subscriptions.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

function buildTodoOrderBy(
  orderBy?: TodoOrderBy,
): Record<string, 'asc' | 'desc'> {
  if (!orderBy) return { priority: 'desc', createdAt: 'desc' };
  const entries = Object.entries(orderBy)
    .filter((e): e is [string, InnerOrder] => e[1] != null)
    .sort(([, a], [, b]) => a.priority - b.priority);
  if (entries.length === 0) return { priority: 'desc', createdAt: 'desc' };
  return Object.fromEntries(
    entries.map(([field, inner]) => [field, inner.direction]),
  );
}

export function applyTodoResolvers(
  queryFields: Fields,
  mutationFields: Fields,
): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myTodos!.resolve = async (
    _parent,
    args: {
      listId?: string;
      completed?: boolean;
      orderBy?: TodoOrderBy;
    },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const where: Record<string, unknown> = { userId: context.userId };
    if (args.listId) where.listId = args.listId;
    if (args.completed === true) where.completedAt = { isNotNull: true };
    else if (args.completed === false) where.completedAt = { isNull: true };
    return context.db.query.todos.findMany({
      where,
      orderBy: buildTodoOrderBy(args.orderBy),
    });
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCreateTodo!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = CreateTodoInput.parse(args.input);

    // Validate list ownership before insert
    const list = await context.db.query.todoLists.findFirst({
      where: { id: input.listId },
    });
    if (!list) throw new Error(`TodoList ${input.listId} not found`);
    if (list.userId !== context.userId) throw new Error('Forbidden');

    const [todo] = await context.db
      .insert(todos)
      .values({
        userId: context.userId,
        listId: input.listId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        estimatedLength: input.estimatedLength ?? 0,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        scheduledAt: input.scheduledAt
          ? new Date(input.scheduledAt)
          : undefined,
      })
      .returning();
    if (!todo) throw new Error('Failed to create todo');
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    pubsub
      .publish(TODO_EVENT(context.userId), { type: 'created', todo })
      .catch(console.error);
    return todo;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUpdateTodo!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = UpdateTodoInput.parse(args.input);
    const existing = await context.db.query.todos.findFirst({
      where: { id: input.id },
    });
    if (!existing) throw new Error(`Todo ${input.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');

    if (input.listId !== undefined) {
      const list = await context.db.query.todoLists.findFirst({
        where: { id: input.listId },
      });
      if (!list) throw new Error(`TodoList ${input.listId} not found`);
      if (list.userId !== context.userId) throw new Error('Forbidden');
    }

    const [updated] = await context.db
      .update(todos)
      .set({
        ...(input.listId !== undefined && { listId: input.listId }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.estimatedLength !== undefined && {
          estimatedLength: input.estimatedLength,
        }),
        ...('dueAt' in input && {
          dueAt: input.dueAt ? new Date(input.dueAt) : null,
        }),
        ...(input.scheduledAt !== undefined && {
          scheduledAt: new Date(input.scheduledAt),
        }),
        ...(input.manuallyScheduled !== undefined && {
          manuallyScheduled: input.manuallyScheduled,
        }),
        ...('completedAt' in input && {
          completedAt:
            input.completedAt === null
              ? null
              : new Date(input.completedAt as string),
        }),
        updatedAt: new Date(),
      })
      .where(eq(todos.id, input.id))
      .returning();
    if (!updated) throw new Error(`Failed to update todo ${input.id}`);
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    pubsub
      .publish(TODO_EVENT(context.userId), { type: 'updated', todo: updated })
      .catch(console.error);
    return updated;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCompleteTodo!.resolve = async (
    _parent,
    args: { id: string; completedAt?: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const existing = await context.db.query.todos.findFirst({
      where: { id: args.id },
    });
    if (!existing) throw new Error(`Todo ${args.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');
    const completedAt = args.completedAt
      ? new Date(args.completedAt)
      : new Date();
    // Move scheduledAt to match completedAt — the calendar record reflects
    // *when the work actually happened*, not when it was originally planned.
    // If completed early, this frees the original future slot for the
    // scheduler to backfill on the next writeback.
    const [completed] = await context.db
      .update(todos)
      .set({
        completedAt,
        scheduledAt: completedAt,
        updatedAt: new Date(),
      })
      .where(eq(todos.id, args.id))
      .returning();
    if (!completed) throw new Error(`Failed to complete todo ${args.id}`);
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    pubsub
      .publish(TODO_EVENT(context.userId), { type: 'updated', todo: completed })
      .catch(console.error);
    return completed;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myDeleteTodo!.resolve = async (
    _parent,
    args: { id: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const existing = await context.db.query.todos.findFirst({
      where: { id: args.id },
    });
    if (!existing) throw new Error(`Todo ${args.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');
    await context.db.delete(todos).where(eq(todos.id, args.id));
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    pubsub
      .publish(TODO_EVENT(context.userId), {
        type: 'deleted',
        deletedId: args.id,
      })
      .catch(console.error);
    return true;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myDeleteTodos!.resolve = async (
    _parent,
    args: { listId: string; completed?: boolean },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    // Scope every delete to the caller and a single list, so there is no way
    // to bulk-delete another user's todos or wipe everything with an empty
    // filter. `completed` optionally narrows to (in)complete todos.
    const conditions = [
      eq(todos.userId, context.userId),
      eq(todos.listId, args.listId),
    ];
    if (args.completed === true) conditions.push(isNotNull(todos.completedAt));
    else if (args.completed === false)
      conditions.push(isNull(todos.completedAt));

    const deleted = await context.db
      .delete(todos)
      .where(and(...conditions))
      .returning();

    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    for (const todo of deleted) {
      pubsub
        .publish(TODO_EVENT(context.userId), {
          type: 'deleted',
          deletedId: todo.id,
        })
        .catch(console.error);
    }
    return deleted;
  };
}
