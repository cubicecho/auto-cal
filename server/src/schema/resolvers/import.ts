import { type NewTodo, todoLists, todos } from '@auto-cal/db/schema';
import type { GraphQLObjectType } from 'graphql';
import type { Context } from '../../context.ts';
import { pubsub } from '../../pubsub.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import { ImportTodosInput } from '../validators.ts';
import { TODO_EVENT, TODO_LIST_EVENT } from './subscriptions.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

// Parse an ISO-ish date string, returning null when it can't be parsed rather
// than throwing — imported files carry inconsistent date formats.
function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function applyImportResolvers(mutationFields: Fields): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL
  mutationFields.myImportTodos!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const userId = context.userId;
    const input = ImportTodosInput.parse(args.input);

    // Validate every referenced activity type belongs to the caller up front,
    // so the transaction never runs against a foreign or missing type.
    const ownedTypes = await context.db.query.activityTypes.findMany({
      where: { userId },
    });
    const owned = new Set(ownedTypes.map((t: { id: string }) => t.id));
    for (const list of input.lists) {
      if (!owned.has(list.activityTypeId)) {
        throw new Error(`ActivityType ${list.activityTypeId} not found`);
      }
    }

    const createdLists: (typeof todoLists.$inferSelect)[] = [];
    const createdTodos: (typeof todos.$inferSelect)[] = [];

    await context.db.transaction(async (tx: typeof context.db) => {
      for (const listInput of input.lists) {
        const [list] = await tx
          .insert(todoLists)
          .values({
            userId,
            name: listInput.name,
            description: listInput.description ?? null,
            activityTypeId: listInput.activityTypeId,
            defaultPriority: listInput.defaultPriority,
            defaultEstimatedLength: listInput.defaultEstimatedLength,
          })
          .returning();
        if (!list) throw new Error('Failed to create imported list');
        createdLists.push(list);

        if (listInput.todos.length === 0) continue;
        const rows: NewTodo[] = listInput.todos.map((todo) => ({
          userId,
          listId: list.id,
          title: todo.title,
          description: todo.description ?? null,
          priority: listInput.defaultPriority,
          estimatedLength: listInput.defaultEstimatedLength,
          dueAt: parseDate(todo.dueAt),
          completedAt: parseDate(todo.completedAt),
        }));
        const inserted = await tx.insert(todos).values(rows).returning();
        createdTodos.push(...inserted);
      }
    });

    // Rescheduling and cache updates are best-effort — the import already
    // committed, so failures here must not surface as an import error.
    runSchedulerWriteback(context.db, userId).catch(console.error);
    for (const list of createdLists) {
      pubsub
        .publish(TODO_LIST_EVENT(userId), { type: 'created', todoList: list })
        .catch(console.error);
    }
    for (const todo of createdTodos) {
      pubsub
        .publish(TODO_EVENT(userId), { type: 'created', todo })
        .catch(console.error);
    }

    return {
      listsCreated: createdLists.length,
      todosCreated: createdTodos.length,
    };
  };
}
