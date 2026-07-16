import type { GraphQLObjectType } from 'graphql';
import type { Context } from '../../context.ts';
import { pubsub } from '../../pubsub.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

export const TODO_EVENT = (userId: string) => `TODO_EVENT:${userId}`;
export const TODO_LIST_EVENT = (userId: string) => `TODO_LIST_EVENT:${userId}`;
export const DATA_EVENT = (userId: string) => `DATA_EVENT:${userId}`;

/** Entities that use the generic `myDataChanged` refetch-on-signal stream. */
export type DataEntity = 'habit' | 'activityType' | 'timeBlock' | 'project';

/**
 * Fire-and-forget broadcast that an entity changed. Listeners refetch the
 * queries that render the entity (or its derived stats). Never awaited — call
 * with `.catch(console.error)` like the schedule writeback.
 */
export function publishDataChanged(
  userId: string,
  entity: DataEntity,
  ids: string[] = [],
): void {
  pubsub.publish(DATA_EVENT(userId), { entity, ids }).catch(console.error);
}

export function applySubscriptionResolvers(subscriptionFields: Fields): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  subscriptionFields.myTodosUpdated!.subscribe = (
    _parent,
    _args,
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    return pubsub.asyncIterableIterator(TODO_EVENT(context.userId));
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  subscriptionFields.myTodosUpdated!.resolve = (payload: unknown) => payload;

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  subscriptionFields.myTodoListsUpdated!.subscribe = (
    _parent,
    _args,
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    return pubsub.asyncIterableIterator(TODO_LIST_EVENT(context.userId));
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  subscriptionFields.myTodoListsUpdated!.resolve = (payload: unknown) =>
    payload;

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  subscriptionFields.myDataChanged!.subscribe = (
    _parent,
    _args,
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    return pubsub.asyncIterableIterator(DATA_EVENT(context.userId));
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  subscriptionFields.myDataChanged!.resolve = (payload: unknown) => payload;
}
