import { todos } from '@auto-cal/db/schema';
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { requireUser } from '../../errors.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import {
  CreateTodoInput,
  TodoIdsInput,
  UpdateTodoInput,
} from '../validators.ts';
import { loadOwned, loadOwnedMany } from './load.ts';
import { publishTodoEvent } from './subscriptions.ts';
import type { FieldMap, MutationMap } from './types.ts';

export const todoMutations: MutationMap<
  | 'myCreateTodo'
  | 'myUpdateTodo'
  | 'myCompleteTodo'
  | 'myCompleteTodos'
  | 'myUnscheduleTodo'
  | 'myDeleteTodo'
  | 'myDeleteTodos'
  | 'myDeleteTodosById'
> = {
  myCreateTodo: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = CreateTodoInput.parse(args.input);

    // Validate list ownership before insert
    await loadOwned(context, 'todoLists', input.listId, userId);

    const [todo] = await context.db
      .insert(todos)
      .values({
        userId,
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
    await loadOwned(context, 'todos', input.id, userId);

    if (input.listId !== undefined) {
      await loadOwned(context, 'todoLists', input.listId, userId);
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
    await loadOwned(context, 'todos', args.id, userId);
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

  // The multi-select form of `myCompleteTodo`. Deliberately one mutation
  // rather than N calls batched into one request: each of those would fire its
  // own fire-and-forget `runSchedulerWriteback`, and N concurrent writebacks
  // for one user race each other over the same `scheduledAt` columns. One
  // mutation means one write and one writeback.
  myCompleteTodos: async (_parent, args, context) => {
    const userId = requireUser(context);
    const ids = TodoIdsInput.parse(args.ids);
    await loadOwnedMany(context, 'todos', ids, userId);

    const completedAt = args.completedAt
      ? new Date(args.completedAt)
      : new Date();
    // Same `scheduledAt = completedAt` move as the single-todo form: the
    // calendar records when the work happened, not when it was planned.
    const completed = await context.db
      .update(todos)
      .set({ completedAt, scheduledAt: completedAt, updatedAt: new Date() })
      .where(and(eq(todos.userId, userId), inArray(todos.id, ids)))
      .returning();

    runSchedulerWriteback(context.db, userId).catch(console.error);
    for (const todo of completed) {
      publishTodoEvent(userId, { type: 'updated', entity: todo });
    }
    return completed;
  },

  myUnscheduleTodo: async (_parent, args, context) => {
    const userId = requireUser(context);
    await loadOwned(context, 'todos', args.id, userId);
    // Clear the manual pin and the slot so the scheduler re-places it on the
    // next writeback (fired below).
    const [updated] = await context.db
      .update(todos)
      .set({
        manuallyScheduled: false,
        scheduledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(todos.id, args.id))
      .returning();
    if (!updated) throw new Error(`Failed to unschedule todo ${args.id}`);
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishTodoEvent(userId, { type: 'updated', entity: updated });
    return updated;
  },

  myDeleteTodo: async (_parent, args, context) => {
    const userId = requireUser(context);
    await loadOwned(context, 'todos', args.id, userId);
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

  // Arbitrary multi-select delete. `myDeleteTodos` covers "clear this list";
  // this covers "clear these five", which no list-and-completed filter can
  // express. Same single-writeback reasoning as `myCompleteTodos`.
  myDeleteTodosById: async (_parent, args, context) => {
    const userId = requireUser(context);
    const ids = TodoIdsInput.parse(args.ids);
    await loadOwnedMany(context, 'todos', ids, userId);

    const deleted = await context.db
      .delete(todos)
      .where(and(eq(todos.userId, userId), inArray(todos.id, ids)))
      .returning();

    runSchedulerWriteback(context.db, userId).catch(console.error);
    for (const todo of deleted) {
      publishTodoEvent(userId, { type: 'deleted', deletedId: todo.id });
    }
    return deleted;
  },
};

export const todoFields: FieldMap<'Todo', 'activityType'> = {
  // A derived hop (todo → list → activityType), not a Drizzle relation:
  // `todos` has no `activityTypeId` column, it inherits its list's.
  activityType: async (parent, _args, context) => {
    const list = await context.loaders.todoList.load(parent.listId);
    if (!list) return null;
    return context.loaders.activityType.load(list.activityTypeId);
  },
};
