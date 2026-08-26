import type { BuildSchemaConfig } from '@vantreeseba/drizzle-graphql';

// Shared config for every buildSchema call (runtime schema, schema generation,
// tests) so the generated SDL is identical everywhere.
//
// drizzle-graphql v4 replaced `singularTypes`/`suffixes` with `typeNameMapper`.
// Every table key is a regular plural ("todos", "apiKeys"), so stripping the
// trailing "s" reproduces the previous naming: type `Todo`, queries
// `todos`/`todo`, mutations `createTodo`/`createTodos`.
//
// Aggregate queries/fields (new in v4, on by default) are disabled: root
// aggregates would be blocked by blockUnscopedResolvers anyway, and relation
// aggregates would expose live resolvers we don't use.
//
// Every generated CRUD mutation is disabled too. All writes go through the
// hand-written, user-scoped `my*` resolvers, so the generated ones were
// emitted into the SDL only to be replaced with throwing resolvers by
// blockUnscopedResolvers — 50 dead root fields and ~400 lines of SDL that
// still reached client codegen. With all four off, drizzle-graphql omits the
// Mutation type entirely, so `resolvers/index.ts` declares `type Mutation`
// itself and wires it as the root operation (same pattern as Subscription).
export const buildSchemaConfig: BuildSchemaConfig = {
  typeNameMapper: (tableName) => ({
    singular: tableName.replace(/s$/, ''),
    plural: tableName,
  }),
  features: {
    aggregates: false,
    relationAggregates: false,
    insert: false,
    update: false,
    updateMany: false,
    delete: false,
  },
};
