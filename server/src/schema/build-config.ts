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
export const buildSchemaConfig: BuildSchemaConfig = {
  typeNameMapper: (tableName) => ({
    singular: tableName.replace(/s$/, ''),
    plural: tableName,
  }),
  features: { aggregates: false, relationAggregates: false },
};
