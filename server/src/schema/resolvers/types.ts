/**
 * Typed resolver maps.
 *
 * Each domain file exports plain objects keyed by field name and typed with
 * the helpers below, which are `Pick`s of the resolver types graphql-codegen
 * derives from the SDL. That gets three things the old
 * `queryFields.myThing!.resolve = ...` pattern could not:
 *
 * - a typo in a field name is a compile error, not a silent no-op resolver
 * - `args` and the return value are checked against the SDL instead of being
 *   hand-annotated at each call site (`args: { id: string }`)
 * - no `!` assertions, so no `noNonNullAssertion` suppressions
 *
 * `Required<Pick<…>>` rather than `Pick<…>`: every key named in the type
 * parameter must actually be implemented.
 *
 * Note the import is type-only. `__generated__/resolvers.ts` is produced *from*
 * the SDL that `generate_schema.ts` prints by importing this module's siblings,
 * so a value import would be a cycle — Node's type stripping erases this one
 * before it can bite, which is what lets codegen bootstrap from a clean tree.
 */
import type {
  MutationResolvers,
  QueryResolvers,
  SubscriptionResolvers,
} from '../../__generated__/resolvers.ts';

export type QueryMap<K extends keyof QueryResolvers> = Required<
  Pick<QueryResolvers, K>
>;

export type MutationMap<K extends keyof MutationResolvers> = Required<
  Pick<MutationResolvers, K>
>;

export type SubscriptionMap<K extends keyof SubscriptionResolvers> = Required<
  Pick<SubscriptionResolvers, K>
>;
