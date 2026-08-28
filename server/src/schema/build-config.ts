import * as tables from '@auto-cal/db/schema';
import type { BuildSchemaConfig } from '@vantreeseba/drizzle-graphql';
import { is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { TABLE_SCOPE, assertEveryTableScoped } from './scope.ts';

// Fails the boot if a Drizzle table has no row scope, so adding one cannot
// quietly produce a table the API serves unscoped.
assertEveryTableScoped(
  Object.entries(tables)
    .filter(([, value]) => is(value, PgTable))
    .map(([key]) => key),
);

// Shared config for every buildSchema call (runtime schema, schema generation,
// tests) so the generated SDL is identical everywhere.
//
// drizzle-graphql v4 replaced `singularTypes`/`suffixes` with `typeNameMapper`.
// Every table key is a regular plural ("todos", "apiKeys"), so stripping the
// trailing "s" reproduces the previous naming: type `Todo`, queries
// `todos`/`todo`, mutations `createTodo`/`createTodos`.
//
// Aggregate queries/fields (new in v4, on by default) are disabled: root
// aggregates would be stripped by finalizeSchema anyway, and relation
// aggregates would expose live resolvers we don't use.
//
// Every generated CRUD mutation is disabled too. All writes go through the
// hand-written, user-scoped `my*` resolvers, so the generated ones were only
// ever emitted to be stripped again — 50 dead root fields. With all four off,
// drizzle-graphql omits the Mutation type entirely, so `resolvers/index.ts`
// declares `type Mutation` itself and wires it as the root operation (same
// pattern as Subscription).
//
// Generated *queries* can't be disabled this way (drizzle-graphql has no such
// feature flag), so the unscoped ones are removed after the fact by
// finalizeSchema in `resolvers/index.ts`.
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

  // The tenant boundary. Held in scope.ts next to the query-exposure rules, so
  // "who can see which rows" stays answerable from one file. The library ANDs
  // each predicate on last, after the caller's `where`, and applies it to every
  // path that reads the table — including relation fields, which no root-field
  // wrapper can reach.
  scope: TABLE_SCOPE,

  // The API key token hash must never leave the server. Excluding the column
  // keeps it out of every surface derived from the column list at once — the
  // `ApiKey` object type, `ApiKeyFilters`, `ApiKeyOrderBy` and
  // `ApiKeyDistinctColumn` — rather than deleting the output field and then
  // hunting the input types that still mention it. All four are reachable
  // through the live `User.apiKeys` relation, and a filter or an ordering on
  // the hash is an oracle even when the field itself cannot be selected:
  // `where: { keyHash: { eq: "..." } }` confirms a guess and `orderBy` binary
  // searches it.
  //
  // The server still reads and writes the column through Drizzle directly
  // (auth.ts, ical-route.ts, myCreateApiKey); this is a GraphQL-surface rule.
  //
  // This prints "excluded column 'apiKeys.keyHash' is NOT NULL with no default,
  // so generated inserts for 'apiKeys' can never succeed" at build time. It does
  // not apply here — `features.insert` is off, so there are no generated inserts
  // — and there is no flag to silence it.
  exclude: {
    columns: { apiKeys: ['keyHash'] },
  },

  // Presentation order, declared once on the server instead of by every caller.
  //
  // These used to be `defaultOrderBy` entries in QUERY_SCOPE, applied by the
  // root-field wrapper. Moving them here widens where they hold: v8 applies a
  // table's default to its own queries *and* to every to-many relation field
  // that targets it, so a table now presents the same way wherever it is
  // reached from. `projectNotes` is the case that actually needed it — see
  // `projectFields` in resolvers/projects.ts.
  //
  // Only a *missing* `orderBy` is replaced; a caller-supplied one still wins
  // outright, exactly as before.
  //
  // `priority` here is the tiebreak rank, and the HIGHEST number sorts first —
  // not the position in this object. The QUERY_SCOPE entries these replace read
  // `{ priority: desc(0), createdAt: desc(1) }`, which meant todos and habits
  // came back newest-first with the `priority` *column* as a tiebreak that only
  // fired on identical timestamps, i.e. never. That was not the intent; the
  // ranks below are corrected, so the priority column now leads.
  defaults: {
    activityTypes: { orderBy: { name: 'asc' } },
    todoLists: { orderBy: { name: 'asc' } },
    todos: {
      orderBy: {
        priority: { direction: 'desc', priority: 1 },
        createdAt: { direction: 'desc', priority: 0 },
      },
    },
    habits: {
      orderBy: {
        priority: { direction: 'desc', priority: 1 },
        createdAt: { direction: 'desc', priority: 0 },
      },
    },
    timeBlocks: { orderBy: { startTime: 'asc' } },
    manualEvents: { orderBy: { startAt: 'asc' } },
    apiKeys: { orderBy: { createdAt: 'desc' } },
    projects: { orderBy: { createdAt: 'desc' } },
    projectNotes: {
      orderBy: {
        position: { direction: 'asc', priority: 1 },
        createdAt: { direction: 'asc', priority: 0 },
      },
    },
  },
};
