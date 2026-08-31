/**
 * Cache invalidation helpers for mutations.
 *
 * Apollo normalizes every object that carries an `id`, so a mutation that
 * returns the entity it changed already patches every list and detail view
 * holding it — no refetch, no round trip. What normalization *cannot* do is
 * notice that a list gained or lost a member, or that a server-computed field
 * (the schedule, the stats aggregates) no longer reflects the data it was
 * derived from. Those are the only two cases that need help, and this module
 * is how mutations ask for it.
 *
 * The previous approach named the affected *queries*:
 * `refetchQueries: ['GetTodoListsPage', 'GetProjectDetail']`. That coupled
 * every mutation to the set of pages that happened to exist when it was
 * written — miss one and it silently shows stale data, which is how
 * `MySchedule` ended up not refreshing when a todo's estimated length
 * changed. Naming the *schema field* instead invalidates it for every
 * consumer, including pages added later.
 */

import type { ApolloCache, Reference } from '@apollo/client';

/**
 * Root `Query` fields these helpers can invalidate.
 *
 * A `const` tuple rather than bare strings, so the helpers take a checked
 * union; `cache.test.ts` asserts the tuple against the SDL, which catches a
 * field that gets renamed or dropped on the server.
 */
export const ROOT_FIELDS = [
  'myActivityTypeStats',
  'myActivityTypes',
  'myApiKeys',
  'myHabitDetail',
  'myHabitStats',
  'myHabits',
  'myManualEvents',
  'myNotificationPreferences',
  'myProfile',
  'myProject',
  'myProjects',
  'myPushPublicKey',
  'mySchedule',
  'myStats',
  'myTimeBlocks',
  'myTodoLists',
  'myTodos',
] as const;

export type RootField = (typeof ROOT_FIELDS)[number];

/**
 * The fields the server recomputes rather than stores: the scheduler rebuilds
 * `mySchedule` from scratch on every call, and the stats queries aggregate
 * todos and habit completions. No mutation result can patch these, so any
 * write that could move them has to drop them.
 *
 * Spread it — `invalidate(cache, 'myTodos', ...DERIVED)`.
 */
export const DERIVED: readonly RootField[] = [
  'mySchedule',
  'myStats',
  'myActivityTypeStats',
  'myHabitStats',
  'myHabitDetail',
];

/**
 * Forget the cached results of the named root fields.
 *
 * Eviction is by field name, so it covers every argument variation at once —
 * `mySchedule` for all weeks, not just the one on screen. Active queries
 * reading an evicted field re-fetch (the default `cache-and-network` policy);
 * queries for screens that aren't mounted simply have no cached value to go
 * stale.
 */
export function invalidate(
  cache: ApolloCache,
  ...fields: readonly RootField[]
): void {
  for (const fieldName of fields) cache.evict({ id: 'ROOT_QUERY', fieldName });
  cache.gc();
}

/**
 * Add a newly-created entity to a list field on its parent — `Project.notes`
 * after adding a note.
 *
 * `invalidate` only reaches root fields; a nested list has no `ROOT_QUERY`
 * entry to evict. Splicing the reference in is also better than re-fetching
 * here: the new item is in the cache by the time the mutation promise
 * resolves, so a caller that wants to select or focus it can do so without
 * waiting for a round trip.
 *
 * Appends, which matches every list the server returns in insertion or
 * position order. A list ordered any other way needs its own `cache.modify`.
 */
export function appendToField(
  cache: ApolloCache,
  parent: { __typename: string; id: string },
  fieldName: string,
  entity: { __typename?: string; id: string },
): void {
  const parentId = cache.identify(parent);
  if (!parentId) return;
  cache.modify({
    id: parentId,
    fields: {
      [fieldName]: (existing, { toReference }) => {
        const ref = toReference(entity);
        if (!ref) return existing;
        return [...((existing as readonly Reference[] | undefined) ?? []), ref];
      },
    },
  });
}

/**
 * Drop a deleted entity from the cache.
 *
 * Lists holding it do not need rewriting: Apollo filters dangling references
 * out when it reads an array, so the item disappears from every query that
 * had it without any of them being named here.
 *
 * `id` is widened to accept a number because the generated `Scalars['ID']`
 * input type is `string | number`, and the usual caller passes the mutation's
 * own variables straight through.
 */
export function evictEntity(
  cache: ApolloCache,
  __typename: string,
  id: string | number,
): void {
  const cacheId = cache.identify({ __typename, id: String(id) });
  if (!cacheId) return;
  cache.evict({ id: cacheId });
  cache.gc();
}
