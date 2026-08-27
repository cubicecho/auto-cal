import { MapperKind, mapSchema, pruneSchema } from '@graphql-tools/utils';
import {
  type GraphQLFieldResolver,
  type GraphQLObjectType,
  type GraphQLSchema,
  extendSchema,
  parse,
} from 'graphql';
import type { Context } from '../../context.ts';
import { scopeRootFields } from '../scope.ts';
import {
  activityTypeFields,
  activityTypeMutations,
  activityTypeQueries,
} from './activity-types.ts';
import { apiKeyMutations } from './api-keys.ts';
import { authMutations } from './auth.ts';
import { habitMutations, habitQueries } from './habits.ts';
import { importMutations } from './import.ts';
import { profileMutations } from './profile.ts';
import { projectFields, projectMutations } from './projects.ts';
import { scheduleMutations, scheduleQueries } from './schedule.ts';
import { statsQueries } from './stats.ts';
import { subscriptionResolvers } from './subscriptions.ts';
import { timeBlockMutations } from './time-blocks.ts';
import { todoListMutations } from './todo-lists.ts';
import { todoFields, todoMutations } from './todos.ts';

const extensionSDL = `
  type ActivityTypeStats {
    activityTypeId: String!
    activityTypeName: String!
    totalTodos: Int!
    completedTodos: Int!
    totalHabits: Int!
  }

  type HabitStats {
    habitId: String!
    title: String!
    completionRate: Float!
    totalCompletions: Int!
  }

  type HabitPeriod {
    label: String!
    periodStart: String!
    periodEnd: String!
    completions: Int!
    target: Int!
    rate: Float!
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
    periods: [HabitPeriod!]!
  }

  type HabitStatSummary {
    habitId: ID!
    title: String!
    completionRate: Float!
    completions: Int!
    target: Float!
    frequencyUnit: String!
    frequencyCount: Int!
    activityType: ActivityType
  }

  type TodoStatSummary {
    total: Int!
    completed: Int!
    overdue: Int!
    completionRate: Float!
  }

  type StatsOverview {
    weightedScore: Float
    habitScore: Float
    todoScore: Float
    habits: [HabitStatSummary!]!
    todos: TodoStatSummary!
  }

  enum ScheduledItemKind {
    todo
    habit
    pomodoro
  }

  type ScheduledItem {
    kind: ScheduledItemKind!
    id: ID!
    title: String!
    priority: Int!
    estimatedLength: Int!
    activityType: ActivityType
    scheduledStart: String
    scheduledEnd: String
    isScheduled: Boolean!
    isOverdue: Boolean!
    completedAt: String
  }

  input CreateActivityTypeArgs {
    name: String!
    color: String
  }

  input CreateProjectArgs {
    name: String!
    parentActivityTypeId: ID
    color: String
    createList: Boolean
  }

  input UpdateProjectArgs {
    id: ID!
    name: String
    status: String
  }

  input CreateProjectNoteArgs {
    projectId: ID!
    title: String!
    content: String
  }

  input UpdateProjectNoteArgs {
    id: ID!
    title: String
    content: String
  }

  input ReorderProjectNotesArgs {
    projectId: ID!
    noteIds: [ID!]!
  }

  input UpdateActivityTypeArgs {
    id: ID!
    name: String
    color: String
  }

  input CreateTodoListArgs {
    name: String!
    description: String
    activityTypeId: ID!
    defaultPriority: Int
    defaultEstimatedLength: Int
  }

  input UpdateTodoListArgs {
    id: ID!
    name: String
    description: String
    activityTypeId: ID
    defaultPriority: Int
    defaultEstimatedLength: Int
  }

  input CreateTodoArgs {
    listId: ID!
    title: String!
    description: String
    priority: Int
    estimatedLength: Int
    dueAt: String
    scheduledAt: String
  }

  input UpdateTodoArgs {
    id: ID!
    listId: ID
    title: String
    description: String
    priority: Int
    estimatedLength: Int
    dueAt: String
    scheduledAt: String
    manuallyScheduled: Boolean
    completedAt: String
  }

  input CreateHabitArgs {
    title: String!
    description: String
    priority: Int
    estimatedLength: Int
    activityTypeId: ID!
    frequencyCount: Int!
    frequencyUnit: String!
    minTimeBetweenInstances: Int
    pomodoroEnabled: Boolean
    pomodoroUnitLength: Int
    pomodoroShortBreakLength: Int
    pomodoroUnitsBeforeLongBreak: Int
    pomodoroLongBreakLength: Int
    pomodoroMaxPerDay: Int
  }

  input CreateTimeBlockArgs {
    activityTypeId: ID!
    daysOfWeek: [Int!]!
    startTime: String!
    endTime: String!
    priority: Int
  }

  input UpdateHabitArgs {
    id: ID!
    title: String
    description: String
    priority: Int
    estimatedLength: Int
    activityTypeId: ID
    frequencyCount: Int
    frequencyUnit: String
    minTimeBetweenInstances: Int
    pomodoroEnabled: Boolean
    pomodoroUnitLength: Int
    pomodoroShortBreakLength: Int
    pomodoroUnitsBeforeLongBreak: Int
    pomodoroLongBreakLength: Int
    pomodoroMaxPerDay: Int
  }

  input UpdateTimeBlockArgs {
    id: ID!
    activityTypeId: ID
    daysOfWeek: [Int!]
    startTime: String
    endTime: String
    priority: Int
  }

  input CompleteHabitArgs {
    habitId: ID!
    scheduledAt: String
    completedAt: String
  }

  type CreateApiKeyResult {
    apiKey: ApiKey!
    token: String!
  }

  input MyCreateApiKeyInput {
    name: String!
    scopes: [String!]!
    expiresAt: String
  }

  input ImportTodoInput {
    title: String!
    description: String
    dueAt: String
    completedAt: String
  }

  input ImportTodoListInput {
    name: String!
    description: String
    activityTypeId: ID!
    defaultPriority: Int
    defaultEstimatedLength: Int
    todos: [ImportTodoInput!]!
  }

  input ImportTodosArgs {
    lists: [ImportTodoListInput!]!
  }

  type ImportTodosResult {
    listsCreated: Int!
    todosCreated: Int!
  }

  enum TodoEventType {
    created
    updated
    deleted
  }

  type TodoListEvent {
    type: TodoEventType!
    todoList: TodoList
    deletedId: ID
  }

  type TodoEvent {
    type: TodoEventType!
    todo: Todo
    deletedId: ID
  }

  # Entities without a typed, payload-carrying event stream. The client maps
  # each one to the root fields it invalidates (see useLiveUpdates) — the ids
  # are informational, letting a listener narrow its response if it wants.
  enum DataEntity {
    habit
    activityType
    timeBlock
    project
  }

  type DataChangedEvent {
    entity: DataEntity!
    ids: [ID!]!
  }

  type Subscription {
    myTodoListsUpdated: TodoListEvent!
    myTodosUpdated: TodoEvent!
    myDataChanged: DataChangedEvent!
  }

  # drizzle-graphql's buildSchema sets the query root operation explicitly, and
  # a conventionally-named "type Subscription" / "type Mutation" is NOT
  # auto-promoted to a root operation by extendSchema. Both are wired here:
  # Subscription because the library never generates one, Mutation because
  # build-config turns every generated mutation off, which omits the type.
  # Without this, graphql-js rejects the operation outright ("Schema is not
  # configured to execute mutation/subscription operation").
  extend schema {
    mutation: Mutation
    subscription: Subscription
  }

  extend type Todo {
    activityType: ActivityType
  }

  # Project.activityType / Project.notes and TodoList.project / ProjectNote.project
  # are auto-generated from Drizzle relations (resolvers wired below). Only the
  # single-list convenience field and the activity-type tree links need SDL here.
  extend type Project {
    list: TodoList
  }

  extend type ActivityType {
    parent: ActivityType
    children: [ActivityType!]!
  }

  # myProfile / myActivityTypes / myTodoLists / myTodos / myHabits /
  # myTimeBlocks / myApiKeys / myProjects / myProject are generated queries,
  # renamed and scoped to the caller by \`scopeRootFields\` (../scope.ts). Only
  # the queries that compute something beyond a filter are declared here.
  extend type Query {
    myActivityTypeStats(startDate: String, endDate: String): [ActivityTypeStats!]!
    myHabitStats(habitId: ID, startDate: String, endDate: String): [HabitStats!]!
    myHabitDetail(habitId: ID!, periods: Int): HabitDetail!
    myStats(startDate: String, endDate: String): StatsOverview!
    mySchedule(weekStart: String, timezone: String): [ScheduledItem!]!
  }

  # Declared, not extended: build-config disables every generated mutation, so
  # drizzle-graphql omits the Mutation type and there is nothing to extend.
  type Mutation {
    myUpdateProfile(timezone: String!): Boolean!
    myCreateActivityType(input: CreateActivityTypeArgs!): ActivityType!
    myUpdateActivityType(input: UpdateActivityTypeArgs!): ActivityType!
    myDeleteActivityType(id: ID!): Boolean!
    myCreateTodoList(input: CreateTodoListArgs!): TodoList!
    myUpdateTodoList(input: UpdateTodoListArgs!): TodoList!
    myDeleteTodoList(id: ID!): Boolean!
    myCreateTodo(input: CreateTodoArgs!): Todo!
    myUpdateTodo(input: UpdateTodoArgs!): Todo!
    myCompleteTodo(id: ID!, completedAt: String): Todo!
    myDeleteTodo(id: ID!): Boolean!
    myDeleteTodos(listId: ID!, completed: Boolean): [Todo!]!
    myCreateHabit(input: CreateHabitArgs!): Habit!
    myDeleteHabit(id: ID!): Boolean!
    myUpdateHabit(input: UpdateHabitArgs!): Habit!
    myUpdateTimeBlock(input: UpdateTimeBlockArgs!): TimeBlock!
    myCompleteHabit(input: CompleteHabitArgs!): HabitCompletion!
    myUncompleteHabit(completionId: ID!): Boolean!
    myCreateTimeBlock(input: CreateTimeBlockArgs!): TimeBlock!
    myDeleteTimeBlock(id: ID!): Boolean!
    myReschedule(weekStart: String): Boolean!
    requestMagicLink(email: String!): RequestMagicLinkResult!
    verifyMagicLink(token: String!): VerifyMagicLinkResult!
    myCreateApiKey(input: MyCreateApiKeyInput!): CreateApiKeyResult!
    myRevokeApiKey(id: ID!): Boolean!
    myImportTodos(input: ImportTodosArgs!): ImportTodosResult!
    myCreateProject(input: CreateProjectArgs!): Project!
    myUpdateProject(input: UpdateProjectArgs!): Project!
    myArchiveProject(id: ID!): Project!
    myCreateProjectNote(input: CreateProjectNoteArgs!): ProjectNote!
    myUpdateProjectNote(input: UpdateProjectNoteArgs!): ProjectNote!
    myReorderProjectNotes(input: ReorderProjectNotesArgs!): [ProjectNote!]!
    myDeleteProjectNote(id: ID!): Boolean!
  }

  type RequestMagicLinkResult {
    ok: Boolean!
    magicLink: String
  }

  type VerifyMagicLinkResult {
    token: String!
    userId: ID!
  }
`;

/**
 * Mutations reachable without authentication, and so without the `my` prefix.
 * Every other mutation must be `my`-prefixed or `finalizeSchema` removes it.
 */
export const PUBLIC_MUTATIONS = new Set([
  'requestMagicLink',
  'verifyMagicLink',
]);

/**
 * Last pass over the schema: drop unscoped mutations, then garbage-collect
 * whatever that leaves unreferenced.
 *
 * **Unscoped root fields.** drizzle-graphql generates a `<table>`/`<table>Single`
 * query per table, none of which filter by the caller. They used to be blocked
 * at runtime with a throwing resolver, but that left them in the SDL — shipped
 * to introspection and to client codegen as autocompletable operations that
 * always fail. Removing the field makes the same query fail validation instead,
 * one layer earlier and without advertising it. Queries are handled earlier now,
 * by `scopeRootFields`, which either scopes a generated field and renames it to
 * its `my*` form or removes it; the check here is a backstop asserting that pass
 * and `extensionSDL` between them left nothing unscoped behind.
 *
 * `keyHash` is no longer handled here: `exclude.columns` in build-config.ts
 * keeps the column out of the object type and out of every input derived from
 * the column list, so there is nothing left to strip after the fact.
 *
 * `mapSchema` rebuilds the schema, so this must run last; field resolvers
 * (generated relation resolvers included) are carried across intact.
 */
function finalizeSchema(schema: GraphQLSchema): GraphQLSchema {
  const mapped = mapSchema(schema, {
    // Queries have no public exemption: `PUBLIC_MUTATIONS` is not consulted
    // here, so a query borrowing one of those names still fails the assertion.
    [MapperKind.QUERY_ROOT_FIELD]: (_field, fieldName) => {
      if (!fieldName.startsWith('my')) {
        throw new Error(
          `Query.${fieldName} is not scoped to the caller — every query must be \`my\`-prefixed`,
        );
      }
      return undefined;
    },
    [MapperKind.MUTATION_ROOT_FIELD]: (_field, fieldName) =>
      fieldName.startsWith('my') || PUBLIC_MUTATIONS.has(fieldName)
        ? undefined
        : null,
  });

  // The removed root fields were the only reference to a chunk of the
  // generated input types; prune drops those. It does not empty the SDL —
  // the generated relation fields still carry `*Filters`/`*OrderBy` args.
  return pruneSchema(mapped);
}

/**
 * Attach a typed resolver map to a type, in place.
 *
 * A field-name typo is already a compile error (the maps are `Pick`s of the
 * generated resolver types), so the runtime check here only catches the case
 * the types cannot see: an SDL field that exists in `__generated__` but not in
 * the schema this was called with — a stale codegen run.
 */
function attach(
  type: GraphQLObjectType,
  resolvers: Record<string, unknown>,
): void {
  const fields = type.getFields();
  for (const [fieldName, resolver] of Object.entries(resolvers)) {
    const field = fields[fieldName];
    if (!field) {
      throw new Error(
        `${type.name}.${fieldName} has a resolver but is not in the schema — regenerate schema.graphql`,
      );
    }
    if (typeof resolver === 'function') {
      field.resolve = resolver as GraphQLFieldResolver<unknown, Context>;
    } else {
      const { subscribe, resolve } = resolver as {
        subscribe: GraphQLFieldResolver<unknown, Context>;
        resolve: GraphQLFieldResolver<unknown, Context>;
      };
      field.subscribe = subscribe;
      field.resolve = resolve;
    }
  }
}

export function applyCustomResolvers(schema: GraphQLSchema): GraphQLSchema {
  // Scope first: this renames the generated `todos`/`project`/... queries to
  // their `my*` form and wraps each resolver with the caller's filter, so the
  // extension below adds only the queries that do real work beyond scoping.
  const extended = extendSchema(scopeRootFields(schema), parse(extensionSDL));

  const queryType = extended.getType('Query') as GraphQLObjectType;
  const mutationType = extended.getType('Mutation') as GraphQLObjectType;
  const subscriptionType = extended.getType(
    'Subscription',
  ) as GraphQLObjectType;

  attach(queryType, {
    ...activityTypeQueries,
    ...habitQueries,
    ...statsQueries,
    ...scheduleQueries,
  });
  attach(mutationType, {
    ...profileMutations,
    ...activityTypeMutations,
    ...todoListMutations,
    ...todoMutations,
    ...habitMutations,
    ...timeBlockMutations,
    ...scheduleMutations,
    ...projectMutations,
    ...authMutations,
    ...apiKeyMutations,
    ...importMutations,
  });
  attach(subscriptionType, subscriptionResolvers);

  // drizzle-graphql v4 attaches resolvers to every Drizzle-relation field
  // (eager when the parent query pre-fetched it, request-batched lazy loads
  // otherwise), so plain DB rows returned by custom resolvers resolve their
  // relation fields without help. The explicit field resolvers below cover
  // only what that machinery can't: custom SDL fields, derived hops, and one
  // to-many relation that needs a specific ordering.

  attach(
    extended.getType('ActivityType') as GraphQLObjectType,
    activityTypeFields,
  );
  attach(extended.getType('Project') as GraphQLObjectType, projectFields);
  attach(extended.getType('Todo') as GraphQLObjectType, todoFields);

  return finalizeSchema(extended);
}
