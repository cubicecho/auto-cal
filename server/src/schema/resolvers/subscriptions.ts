import type { Todo, TodoList } from '@auto-cal/db';
import type {
  DataEntity,
  TodoEventType,
} from '../../__generated__/resolvers.ts';
import { requireUser } from '../../errors.ts';
import { pubsub } from '../../pubsub.ts';
import type { SubscriptionMap } from './types.ts';

export const TODO_EVENT = (userId: string) => `TODO_EVENT:${userId}`;
export const TODO_LIST_EVENT = (userId: string) => `TODO_LIST_EVENT:${userId}`;
export const DATA_EVENT = (userId: string) => `DATA_EVENT:${userId}`;

/**
 * Entities that use the generic `myDataChanged` refetch-on-signal stream.
 * Re-exported from the generated types so the `DataEntity` enum in the SDL
 * stays the single definition.
 */
export type { DataEntity };

/**
 * What a publisher supplies. The helpers below widen it to the full event
 * type — every field present, absent ones explicitly null — so the `resolve`
 * functions can hand the payload straight back as the field value.
 *
 * All three publish helpers are fire-and-forget; none is ever awaited, like
 * the schedule writeback.
 */
type Change<T> =
  | { type: Exclude<TodoEventType, 'deleted'>; entity: T }
  | { type: 'deleted'; deletedId: string };

/**
 * The published payloads. Deliberately spelled out against the Drizzle row
 * types rather than reusing the generated `TodoEvent`/`TodoListEvent`: those
 * describe the fully-resolved GraphQL object (`todo.list`, `todo.user`, …),
 * whereas what actually goes over the wire is a bare row whose relation fields
 * the generated resolvers fill in later.
 */
type TodoEventPayload = {
  type: TodoEventType;
  todo: Todo | null;
  deletedId: string | null;
};

type TodoListEventPayload = {
  type: TodoEventType;
  todoList: TodoList | null;
  deletedId: string | null;
};

type DataChangedPayload = { entity: DataEntity; ids: string[] };

export function publishTodoEvent(userId: string, change: Change<Todo>): void {
  const event: TodoEventPayload = {
    type: change.type,
    todo: 'entity' in change ? change.entity : null,
    deletedId: 'deletedId' in change ? change.deletedId : null,
  };
  pubsub.publish(TODO_EVENT(userId), event).catch(console.error);
}

export function publishTodoListEvent(
  userId: string,
  change: Change<TodoList>,
): void {
  const event: TodoListEventPayload = {
    type: change.type,
    todoList: 'entity' in change ? change.entity : null,
    deletedId: 'deletedId' in change ? change.deletedId : null,
  };
  pubsub.publish(TODO_LIST_EVENT(userId), event).catch(console.error);
}

/**
 * Broadcast that an entity changed. Listeners refetch the queries that render
 * the entity (or its derived stats); the ids let a listener narrow if it wants.
 */
export function publishDataChanged(
  userId: string,
  entity: DataEntity,
  ids: string[] = [],
): void {
  const event: DataChangedPayload = { entity, ids };
  pubsub.publish(DATA_EVENT(userId), event).catch(console.error);
}

/**
 * `subscribe` yields whatever was published; `resolve` maps it to the field
 * value. The publish helpers above already shape the payload as the event
 * type, so every `resolve` here is identity.
 */
export const subscriptionResolvers: SubscriptionMap<
  'myTodosUpdated' | 'myTodoListsUpdated' | 'myDataChanged'
> = {
  myTodosUpdated: {
    subscribe: (_parent, _args, context) =>
      pubsub.asyncIterableIterator(TODO_EVENT(requireUser(context))),
    resolve: (payload: TodoEventPayload) => payload,
  },
  myTodoListsUpdated: {
    subscribe: (_parent, _args, context) =>
      pubsub.asyncIterableIterator(TODO_LIST_EVENT(requireUser(context))),
    resolve: (payload: TodoListEventPayload) => payload,
  },
  myDataChanged: {
    subscribe: (_parent, _args, context) =>
      pubsub.asyncIterableIterator(DATA_EVENT(requireUser(context))),
    resolve: (payload: DataChangedPayload) => payload,
  },
};
