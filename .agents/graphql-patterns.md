# GraphQL Patterns

## Schema Generation Pipeline

1. `buildSchema(db)` auto-generates base schema from Drizzle tables via `@vantreeseba/drizzle-graphql`
2. `scopeRootFields()` (`schema/scope.ts`) renames each generated root query to its `my*` form and wraps the resolver so it AND-s a caller predicate onto the client's `where`; generated queries with no rule are deleted, and one listed in neither `QUERY_SCOPE` nor `UNEXPOSED` throws at boot
3. `applyCustomResolvers()` extends the scoped schema with the remaining hand-written `my*` queries and every mutation via `extendSchema`, then ends with `finalizeSchema()`, which asserts no unprefixed `Query` field survived, **removes** every `Mutation` field that is neither prefixed `my` nor in `PUBLIC_MUTATIONS` (plus the `keyHash` input surfaces), and prunes the types that leaves unreferenced

Most `my*` queries therefore take the generated argument shape —
`where` / `orderBy` / `limit` / `offset` / `distinct` — rather than hand-declared
arguments. The exceptions are the five that compute something:
`myActivityTypeStats`, `myHabitStats`, `myHabitDetail`, `myStats`, `mySchedule`.

Generated schema written to `server/src/__generated__/schema.graphql` via:
```bash
npm run codegen:server
```

Client types generated from that schema + client operations via:
```bash
npm run codegen
```

## Naming Conventions

| Purpose | Naming Pattern | Example |
|---------|---------------|---------|
| User-scoped queries | `my<Resource>` | `myTodos`, `myProfile` |
| User-scoped mutations | `my<Action><Resource>` | `myCreateTodo`, `myUpdateHabit` |
| Public mutations | Literal name (no `my` prefix); must also be added to `PUBLIC_MUTATIONS` set in `schema/resolvers/index.ts` | `requestMagicLink`, `verifyMagicLink` |
| Input types | `<Action><Resource>Args` | `CreateTodoArgs`, `UpdateHabitArgs` |

The full SDL (drizzle-generated + extensions) is emitted to `server/src/__generated__/schema.graphql` by `npm run codegen:server`.

## Extending the Schema

Add new fields by extending `extensionSDL` in `server/src/schema/resolvers/index.ts`:

```typescript
const extensionSDL = `
  extend type Query {
    myNewThing(id: ID!): NewThing
  }
  # Mutation is declared, not extended — build-config disables every generated
  # mutation, so there is no generated Mutation type to extend. Add the field
  # to the existing declared block.
  type Mutation {
    myCreateNewThing(input: CreateNewThingArgs!): NewThing!
  }
  input CreateNewThingArgs {
    name: String!
    value: Int!
  }
  type NewThing {
    id: ID!
    name: String!
    value: Int!
  }
`;
```

Then add the resolver to the domain's typed map and spread that map into the
matching `attach()` call in `applyCustomResolvers`:
```typescript
export const newThingQueries: QueryMap<'myNewThing'> = {
  myNewThing: async (_parent, args, context) => {
    const userId = requireUser(context);
    // ...
  },
};
```
`args` and the return type come from the SDL — regenerate with
`npm run codegen` after editing `extensionSDL`, or the new field won't exist in
`QueryResolvers` yet.

## Core Types (from Drizzle)

```graphql
type Todo {
  id: String!
  userId: String!
  listId: String!
  title: String!
  description: String
  priority: Int!
  estimatedLength: Int!
  dueAt: DateTime
  scheduledAt: DateTime
  completedAt: DateTime
  manuallyScheduled: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  list: TodoList         # drizzle-graphql relation field
  activityType: ActivityType  # field-resolved via the todo's list
}

type TodoList {
  id: String!
  userId: String!
  name: String!
  description: String
  activityTypeId: String!
  defaultPriority: Int!
  defaultEstimatedLength: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
  activityType: ActivityType
}

type Habit {
  id: String!
  userId: String!
  title: String!
  frequencyCount: Int!
  frequencyUnit: String!   # "week" | "month"
  estimatedLength: Int!
  priority: Int!
  activityType: ActivityType
}

type TimeBlock {
  id: String!
  daysOfWeek: [Int!]!      # 0=Sun … 6=Sat
  startTime: String!        # "HH:mm"
  endTime: String!          # "HH:mm"
  priority: Int!
  activityType: ActivityType
}

type ActivityType {
  id: String!
  name: String!
  color: String!            # hex color with # prefix, e.g. "#6366f1" (default)
}

type User {
  id: String!
  email: String!
  timezone: String!         # IANA zone string, default "UTC"
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

## Custom Types (from extensionSDL)

```graphql
type ScheduledItem {
  id: ID!
  kind: ScheduledItemKind!  # TODO | HABIT
  title: String!
  priority: Int!
  estimatedLength: Int!
  activityTypeId: ID
  activityType: ActivityType
  scheduledStart: String    # naive ISO "YYYY-MM-DDTHH:mm:ss"
  scheduledEnd: String
  isScheduled: Boolean!
  isOverdue: Boolean!
  completedAt: DateTime
}

type ActivityTypeStats {
  activityTypeId: String!
  activityTypeName: String!
  totalTodos: Int!
  completedTodos: Int!
  totalHabits: Int!
}
```

## Key Queries

```graphql
# timezone is optional — if provided, saves to the user's profile for future use
# Returns both incomplete todos and completed todos whose scheduledAt falls in the week.
# Completed items always appear in the week their scheduledAt was — they never disappear.
query MySchedule($weekStart: String, $timezone: String) {
  mySchedule(weekStart: $weekStart, timezone: $timezone) {
    id kind title priority estimatedLength
    scheduledStart scheduledEnd isScheduled isOverdue
    activityType { id name color }
  }
}

query MyTodos($where: TodoFilters, $orderBy: TodoOrderBy) {
  myTodos(where: $where, orderBy: $orderBy) {
    id title description priority estimatedLength
    dueAt scheduledAt completedAt manuallyScheduled
    list { id name }
    activityType { id name color }
  }
}

query MyTodoLists {
  myTodoLists {
    id name description defaultPriority defaultEstimatedLength
    activityType { id name color }
  }
}
```

## Additional Types

```graphql
type HabitCompletion {
  id: ID!
  habitId: ID!
  scheduledAt: DateTime   # set for tentative (scheduler-generated) completions
  completedAt: DateTime   # set for actual completions; null = tentative
  createdAt: DateTime!
}

type HabitDetail {
  habitId: ID!
  title: String!
  description: String
  priority: Int!
  estimatedLength: Int!
  frequencyCount: Int!
  frequencyUnit: String!
  activityType: ActivityType
  totalCompletions: Int!
  allTimeRate: Float!
  periods: [HabitPeriod!]!  # most recent first → reversed to chronological
}

type HabitPeriod {
  label: String!           # "This week", "Last week", "2w ago", or month name
  periodStart: String!
  periodEnd: String!
  completions: Int!
  target: Int!
  rate: Float!
}

type StatsOverview {
  weightedScore: Float     # (habitScore + todoScore) / 2; null if no data
  habitScore: Float
  todoScore: Float
  habits: [HabitStatSummary!]!
  todos: TodoStatSummary!
}
```

## Additional Queries

```graphql
# periods: number of weeks/months to return (default 8, max 26)
query MyHabitDetail($habitId: ID!, $periods: Int) {
  myHabitDetail(habitId: $habitId, periods: $periods) {
    habitId title description priority estimatedLength
    frequencyCount frequencyUnit allTimeRate totalCompletions
    activityType { id name color }
    periods { label completions target rate }
  }
}

# `daysOfWeek: { has: 3 }` filters to blocks including that day — 0=Sun…6=Sat.
query MyTimeBlocks($where: TimeBlockFilters) {
  myTimeBlocks(where: $where) {
    id daysOfWeek startTime endTime priority
    activityType { id name color }
  }
}

# startDate/endDate: ISO strings; omit startDate for all-time
query MyStats($startDate: String, $endDate: String) {
  myStats(startDate: $startDate, endDate: $endDate) {
    weightedScore habitScore todoScore
    habits { habitId title completionRate completions target frequencyUnit activityType { color } }
    todos { total completed overdue completionRate }
  }
}
```

## Filtering and ordering

Every scoped query takes the generated `where` / `orderBy` / `limit` / `offset` /
`after` / `distinct` arguments. The caller's `where` is AND-ed with the tenant
scope, so it can only narrow — see `schema/scope.ts`.

`<Table>Filters` has one key per column, each an operator object (`eq`, `ne`,
`isNull`, `isNotNull`, `gt`, `lt`, `inArray`, `like`, `has` for int arrays, …),
plus `AND` / `OR` / `NOT` and a key per relation. Sibling keys are AND-ed.

```graphql
myTodos(where: { listId: { eq: $id }, completedAt: { isNull: true } })
myTimeBlocks(where: { daysOfWeek: { has: 3 } })
myProjects(where: { status: { ne: "archived" } })
myProject(where: { id: { eq: $id } })   # single row, or null
```

`<Table>OrderBy` has one key per column, each an `InnerOrder`:
`{ direction: asc | desc, priority: Int!, nulls: OrderNulls }` — `priority`
orders the sort keys against each other, so multi-column sorts are explicit
rather than dependent on object key order.

```graphql
query MyTodos($orderBy: TodoOrderBy) {
  myTodos(orderBy: $orderBy) { id title priority scheduledAt }
}
# e.g. { orderBy: { scheduledAt: { direction: "asc", priority: 0 } } }
```

Omitting `orderBy` falls back to the per-field default in `QUERY_SCOPE`
(`myTodos` and `myHabits`: priority desc, then createdAt desc). Passing one
replaces that default outright rather than merging with it.

## Key Mutations

```graphql
mutation CreateTodo($input: CreateTodoArgs!) {
  # CreateTodoArgs: listId (required), title (required), description,
  # priority, estimatedLength, dueAt, scheduledAt
  myCreateTodo(input: $input) { id title priority dueAt scheduledAt }
}

mutation UpdateTodo($input: UpdateTodoArgs!) {
  # UpdateTodoArgs: id (required), listId, title, description, priority,
  # estimatedLength, dueAt, scheduledAt, manuallyScheduled, completedAt
  myUpdateTodo(input: $input) { id title priority dueAt scheduledAt completedAt manuallyScheduled }
}

mutation CompleteTodo($id: ID!) {
  myCompleteTodo(id: $id) { id completedAt }
}

mutation CreateTodoList($input: CreateTodoListArgs!) {
  # CreateTodoListArgs: name (required), description, activityTypeId (required),
  # defaultPriority, defaultEstimatedLength
  myCreateTodoList(input: $input) { id name }
}

mutation DeleteTodoList($id: ID!) {
  # Server-side guard: rejects if any todos still reference the list (FK is RESTRICT).
  myDeleteTodoList(id: $id)
}

mutation RequestMagicLink($email: String!) {
  requestMagicLink(email: $email) {
    ok
    magicLink   # dev only — null in production; link always logged to server console
  }
}

mutation VerifyMagicLink($token: String!) {
  verifyMagicLink(token: $token) {
    token    # JWT session token — store as auth_token via client/src/storage.ts
    userId
  }
}

mutation UpdateProfile($timezone: String!) {
  myUpdateProfile(timezone: $timezone)
}
```

## Cache Invalidation

Mutations return the entity they changed, so Apollo's normalized cache patches
every list and detail view holding it with no round trip. Only two things need
help, and both go through `client/src/lib/cache.ts`:

- **Membership changed** (created, deleted, or moved in or out of a filtered
  list) — evict the root field, not the queries reading it:
  ```typescript
  useMutation(CREATE_TODO, {
    update: (cache) => invalidate(cache, 'myTodos', ...DERIVED),
  });
  ```
- **Server-derived fields** — `mySchedule` and the stats queries are recomputed,
  never stored, so no mutation result can patch them. `DERIVED` is the list;
  spread it into any write that could move the schedule.

Deletes use `evictEntity(cache, 'Todo', id)`; Apollo drops dangling references
when it reads an array, so lists holding the item fix themselves. Nested lists
have no root field to evict — use `appendToField` (see `Project.notes`).

`refetchQueries: ['SomeOperationName']` is the thing this replaced. It named
the *pages* that existed when the mutation was written, so a page added later
silently showed stale data. `RootField` is a checked union, and
`cache.test.ts` asserts it against the SDL.

The subscription streams go through the same vocabulary. `useLiveUpdates`
(mounted once, in `app/(app)/_layout.tsx`) is the client's only subscriber;
individual screens never call `useSubscription`. A new `DataEntity` value must
be added to its `Record<DataEntity, readonly RootField[]>` or the client will
not compile.
