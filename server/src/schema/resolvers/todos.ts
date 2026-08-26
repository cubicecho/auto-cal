import { todos } from '@auto-cal/db/schema';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import type { InnerOrder, TodoOrderBy } from '../../__generated__/resolvers.ts';
import { requireOwner, requireUser } from '../../errors.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import { CreateTodoInput, UpdateTodoInput } from '../validators.ts';
import { publishTodoEvent } from './subscriptions.ts';
import type { MutationMap, QueryMap } from './types.ts';

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

export const todoQueries: QueryMap<'myTodos'> = {
  myTodos: async (_parent, args, context) => {
    const userId = requireUser(context);
    const where: Record<string, unknown> = { userId: userId };
    if (args.listId) where.listId = args.listId;
    if (args.completed === true) where.completedAt = { isNotNull: true };
    else if (args.completed === false) where.completedAt = { isNull: true };
    return context.db.query.todos.findMany({
      where,
      orderBy: buildTodoOrderBy(args.orderBy),
    });
  },
};

export const todoMutations: MutationMap<
  | 'myCreateTodo'
  | 'myUpdateTodo'
  | 'myCompleteTodo'
  | 'myDeleteTodo'
  | 'myDeleteTodos'
> = {
  myCreateTodo: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = CreateTodoInput.parse(args.input);

    // Validate list ownership before insert
    requireOwner(
      await context.db.query.todoLists.findFirst({
        where: { id: input.listId },
      }),
      'TodoList',
      input.listId,
      userId,
    );

    const [todo] = await context.db
      .insert(todos)
      .values({
        userId: userId,
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
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishTodoEvent(userId, { type: 'created', entity: todo });
    return todo;
  },

  myUpdateTodo: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = UpdateTodoInput.parse(args.input);
    requireOwner(
      await context.db.query.todos.findFirst({
        where: { id: input.id },
      }),
      'Todo',
      input.id,
      userId,
    );

    if (input.listId !== undefined) {
      requireOwner(
        await context.db.query.todoLists.findFirst({
          where: { id: input.listId },
        }),
        'TodoList',
        input.listId,
        userId,
      );
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
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishTodoEvent(userId, { type: 'updated', entity: updated });
    return updated;
  },

  myCompleteTodo: async (_parent, args, context) => {
    const userId = requireUser(context);
    requireOwner(
      await context.db.query.todos.findFirst({
        where: { id: args.id },
      }),
      'Todo',
      args.id,
      userId,
    );
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
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishTodoEvent(userId, { type: 'updated', entity: completed });
    return completed;
  },

  myDeleteTodo: async (_parent, args, context) => {
    const userId = requireUser(context);
    requireOwner(
      await context.db.query.todos.findFirst({
        where: { id: args.id },
      }),
      'Todo',
      args.id,
      userId,
    );
    await context.db.delete(todos).where(eq(todos.id, args.id));
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishTodoEvent(userId, { type: 'deleted', deletedId: args.id });
    return true;
  },

  myDeleteTodos: async (_parent, args, context) => {
    const userId = requireUser(context);
    // Scope every delete to the caller and a single list, so there is no way
    // to bulk-delete another user's todos or wipe everything with an empty
    // filter. `completed` optionally narrows to (in)complete todos.
    const conditions = [
      eq(todos.userId, userId),
      eq(todos.listId, args.listId),
    ];
    if (args.completed === true) conditions.push(isNotNull(todos.completedAt));
    else if (args.completed === false)
      conditions.push(isNull(todos.completedAt));

    const deleted = await context.db
      .delete(todos)
      .where(and(...conditions))
      .returning();

    runSchedulerWriteback(context.db, userId).catch(console.error);
    for (const todo of deleted) {
      publishTodoEvent(userId, { type: 'deleted', deletedId: todo.id });
    }
    return deleted;
  },
};
