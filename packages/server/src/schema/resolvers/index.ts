import {
  GraphQLList,
  GraphQLNonNull,
  type GraphQLObjectType,
  type GraphQLSchema,
  GraphQLString,
  extendSchema,
  parse,
} from 'graphql';
import type { Context } from '../../context.ts';
import { applyActivityTypeResolvers } from './activity-types.ts';
import { applyApiKeyResolvers } from './api-keys.ts';
import { applyAuthResolvers } from './auth.ts';
import { applyHabitResolvers } from './habits.ts';
import { applyProfileResolvers } from './profile.ts';
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

  type Subscription {
    myTodoListsUpdated: TodoListEvent!
    myTodosUpdated: TodoEvent!
  }

  extend type Todo {
    activityType: ActivityType
  }

  extend type Query {
    myProfile: UserProfile
    myActivityTypes: [ActivityType!]!
    myTodoLists: [TodoList!]!
    myTodos(listId: ID, completed: Boolean, orderBy: TodoOrderBy): [Todo!]!
    myHabits(activityTypeId: ID): [Habit!]!
    myTimeBlocks(activityTypeId: ID, containsDay: Int): [TimeBlock!]!
    activityTypeStats(startDate: String, endDate: String): [ActivityTypeStats!]!
    habitStats(habitId: ID, startDate: String, endDate: String): [HabitStats!]!
    myHabitDetail(habitId: ID!, periods: Int): HabitDetail!
    myStats(startDate: String, endDate: String): StatsOverview!
    mySchedule(weekStart: String, timezone: String): [ScheduledItem!]!
    myApiKeys: [ApiKey!]!
  }

  extend type Mutation {
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
  applyAuthResolvers(mutationFields);
  applyApiKeyResolvers(queryFields, mutationFields);
  applySubscriptionResolvers(subscriptionFields);

  // Field resolvers: activityType on Habit and TimeBlock load directly from
  // their activityTypeId. Todo.activityType derives from its list.
  type RowWithActivityTypeId = { activityTypeId: string };

  function resolveActivityType(
    parent: RowWithActivityTypeId,
    _args: unknown,
    context: Context,
  ) {
    return context.loaders.activityType.load(parent.activityTypeId);
  }

  const habitType = extended.getType('Habit') as GraphQLObjectType;
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  habitType.getFields().activityType!.resolve = resolveActivityType;

  const timeBlockType = extended.getType('TimeBlock') as GraphQLObjectType;
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  timeBlockType.getFields().activityType!.resolve = resolveActivityType;

  // drizzle-graphql generates ApiKey.scopes as String! but the DB stores a
  // text[] array; patch the field type so GraphQL serializes it as [String!]!.
  const apiKeyType = extended.getType('ApiKey') as GraphQLObjectType;
  (apiKeyType.getFields().scopes as unknown as { type: unknown }).type =
    new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString)));

  const todoType = extended.getType('Todo') as GraphQLObjectType;
  const todoFields = todoType.getFields();

  // biome-ignore lint/style/noNonNullAssertion: field exists on Todo type
  todoFields.list!.resolve = (
    parent: { listId: string },
    _args: unknown,
    context: Context,
  ) => context.loaders.todoList.load(parent.listId);

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

  return extended;
}
