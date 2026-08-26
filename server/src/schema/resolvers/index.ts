import { MapperKind, mapSchema } from '@graphql-tools/utils';
import {
  type GraphQLObjectType,
  type GraphQLSchema,
  extendSchema,
  parse,
} from 'graphql';
import type { Context } from '../../context.ts';
import { applyActivityTypeResolvers } from './activity-types.ts';
import { applyApiKeyResolvers } from './api-keys.ts';
import { applyAuthResolvers } from './auth.ts';
import { applyHabitResolvers } from './habits.ts';
import { applyImportResolvers } from './import.ts';
import { applyProfileResolvers } from './profile.ts';
import { applyProjectResolvers } from './projects.ts';
import { applyScheduleResolvers } from './schedule.ts';
import { applyStatsResolvers } from './stats.ts';
import { applySubscriptionResolvers } from './subscriptions.ts';
import { applyTimeBlockResolvers } from './time-blocks.ts';
import { applyTodoListResolvers } from './todo-lists.ts';
import { applyTodoResolvers } from './todos.ts';

const extensionSDL = `
  type UserProfile {
    id: ID!
    email: String!
    timezone: String!
  }

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

  # Entities without a typed, payload-carrying event stream. Pages that render
  # these (or their derived stats/detail) refetch on any matching signal — the
  # ids are informational, letting a listener narrow its response if it wants.
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

  extend type Query {
    myProfile: UserProfile
    myActivityTypes: [ActivityType!]!
    myTodoLists: [TodoList!]!
    myTodos(listId: ID, completed: Boolean, orderBy: TodoOrderBy): [Todo!]!
    myHabits(activityTypeId: ID): [Habit!]!
    myTimeBlocks(activityTypeId: ID, containsDay: Int): [TimeBlock!]!
    myActivityTypeStats(startDate: String, endDate: String): [ActivityTypeStats!]!
    myHabitStats(habitId: ID, startDate: String, endDate: String): [HabitStats!]!
    myHabitDetail(habitId: ID!, periods: Int): HabitDetail!
    myStats(startDate: String, endDate: String): StatsOverview!
    mySchedule(weekStart: String, timezone: String): [ScheduledItem!]!
    myApiKeys: [ApiKey!]!
    myProjects(includeArchived: Boolean): [Project!]!
    myProject(id: ID!): Project
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
 * Remove `keyHash` from every generated ApiKey *input* surface.
 *
 * Deleting the output field (see below) stops the hash being selected, but
 * drizzle-graphql derives `ApiKeyFilters`, `ApiKeyOrderBy` and — since v7 —
 * `ApiKeyDistinctColumn` from the same column list, and those are reachable
 * through the live `User.apiKeys` relation. Left in place they are an oracle:
 * `where: { keyHash: { eq: "..." } }` confirms a guess and `orderBy` binary-
 * searches it. Today that only leaks the caller's own hash, because every
 * reachable `User` is the authenticated one — this closes it before some
 * future resolver makes an arbitrary `User` reachable.
 *
 * `mapSchema` rebuilds the schema, so this must run last; field resolvers
 * (generated relation resolvers included) are carried across intact.
 */
function stripKeyHash(schema: GraphQLSchema): GraphQLSchema {
  const isApiKeyInput = (typeName: string) => typeName.startsWith('ApiKey');
  return mapSchema(schema, {
    [MapperKind.INPUT_OBJECT_FIELD]: (_field, fieldName, typeName) =>
      fieldName === 'keyHash' && isApiKeyInput(typeName) ? null : undefined,
    [MapperKind.ENUM_VALUE]: (_value, typeName, _schema, valueName) =>
      valueName === 'keyHash' && isApiKeyInput(typeName) ? null : undefined,
  });
}

export function applyCustomResolvers(schema: GraphQLSchema): GraphQLSchema {
  const extended = extendSchema(schema, parse(extensionSDL));

  const queryType = extended.getType('Query') as GraphQLObjectType;
  const mutationType = extended.getType('Mutation') as GraphQLObjectType;
  const subscriptionType = extended.getType(
    'Subscription',
  ) as GraphQLObjectType;
  const queryFields = queryType.getFields();
  const mutationFields = mutationType.getFields();
  const subscriptionFields = subscriptionType.getFields();

  applyProfileResolvers(queryFields, mutationFields);
  applyActivityTypeResolvers(queryFields, mutationFields);
  applyTodoListResolvers(queryFields, mutationFields);
  applyTodoResolvers(queryFields, mutationFields);
  applyHabitResolvers(queryFields, mutationFields);
  applyTimeBlockResolvers(queryFields, mutationFields);
  applyStatsResolvers(queryFields);
  applyScheduleResolvers(queryFields, mutationFields);
  applyProjectResolvers(queryFields, mutationFields);
  applyAuthResolvers(mutationFields);
  applyApiKeyResolvers(queryFields, mutationFields);
  applyImportResolvers(mutationFields);
  applySubscriptionResolvers(subscriptionFields);

  // drizzle-graphql v4 attaches resolvers to every Drizzle-relation field
  // (eager when the parent query pre-fetched it, request-batched lazy loads
  // otherwise), so plain DB rows returned by custom resolvers resolve their
  // relation fields without help. The explicit field resolvers below cover
  // only what that machinery can't: custom SDL fields, derived hops, and one
  // to-many relation that needs a specific ordering.

  // Activity-type tree links.
  const activityTypeType = extended.getType(
    'ActivityType',
  ) as GraphQLObjectType;
  const activityTypeFields = activityTypeType.getFields();
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  activityTypeFields.parent!.resolve = (
    parent: { parentId: string | null },
    _args: unknown,
    context: Context,
  ) =>
    parent.parentId ? context.loaders.activityType.load(parent.parentId) : null;
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  activityTypeFields.children!.resolve = (
    parent: { id: string },
    _args: unknown,
    context: Context,
  ) => context.loaders.activityTypeByParent.load(parent.id);

  // Project relation fields.
  const projectType = extended.getType('Project') as GraphQLObjectType;
  const projectFields = projectType.getFields();
  // Overrides the generated relation resolver: notes must come back in
  // position order (myReorderProjectNotes), which the generated lazy batch
  // loader does not apply.
  // biome-ignore lint/style/noNonNullAssertion: auto-generated from projects.notes relation
  projectFields.notes!.resolve = (
    parent: { id: string },
    _args: unknown,
    context: Context,
  ) => context.loaders.projectNotes.load(parent.id);
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  projectFields.list!.resolve = async (
    parent: { id: string },
    _args: unknown,
    context: Context,
  ) => {
    const lists = await context.loaders.todoListsByProject.load(parent.id);
    return lists[0] ?? null;
  };

  // The token hash must never leave the server. myApiKeys/myCreateApiKey
  // return raw DB rows, so the field itself has to go, not just its value.
  // The matching input surfaces are stripped by `stripKeyHash` below — deleting
  // the output field alone leaves `keyHash` filterable and orderable.
  const apiKeyType = extended.getType('ApiKey') as GraphQLObjectType;
  const apiKeyFields = apiKeyType.getFields();
  // biome-ignore lint/performance/noDelete: assigning undefined would leave a dangling key that breaks printSchema; the key must be removed
  delete apiKeyFields.keyHash;

  const todoType = extended.getType('Todo') as GraphQLObjectType;
  const todoFields = todoType.getFields();

  // Derived hop (todo → list → activityType) — not a Drizzle relation.
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  todoFields.activityType!.resolve = async (
    parent: { listId: string },
    _args: unknown,
    context: Context,
  ) => {
    const list = await context.loaders.todoList.load(parent.listId);
    if (!list) return null;
    return context.loaders.activityType.load(list.activityTypeId);
  };

  return stripKeyHash(extended);
}
