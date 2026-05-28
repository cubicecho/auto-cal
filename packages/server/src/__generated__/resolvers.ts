import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Context } from '../context.ts';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | undefined;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: unknown; output: unknown; }
};

export type ActivityType = {
  __typename?: 'ActivityType';
  color: Scalars['String']['output'];
  /** DateTime */
  createdAt: Scalars['DateTime']['output'];
  habits: Array<Habit>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  timeBlocks: Array<TimeBlock>;
  todoLists: Array<TodoList>;
  /** DateTime */
  updatedAt: Scalars['DateTime']['output'];
  user: Maybe<User>;
  userId: Scalars['String']['output'];
};


export type ActivityTypeHabitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HabitOrderBy>;
  where?: InputMaybe<HabitFilters>;
};


export type ActivityTypeTimeBlocksArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TimeBlockOrderBy>;
  where?: InputMaybe<TimeBlockFilters>;
};


export type ActivityTypeTodoListsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TodoListOrderBy>;
  where?: InputMaybe<TodoListFilters>;
};


export type ActivityTypeUserArgs = {
  where?: InputMaybe<UserFilters>;
};

export type ActivityTypeFilters = {
  OR?: InputMaybe<Array<ActivityTypeFiltersOr>>;
  color?: InputMaybe<StringFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<IdFilter>;
  name?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type ActivityTypeFiltersOr = {
  color?: InputMaybe<StringFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<IdFilter>;
  name?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type ActivityTypeOrderBy = {
  color?: InputMaybe<InnerOrder>;
  createdAt?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  name?: InputMaybe<InnerOrder>;
  updatedAt?: InputMaybe<InnerOrder>;
  userId?: InputMaybe<InnerOrder>;
};

export type ActivityTypeStats = {
  __typename?: 'ActivityTypeStats';
  activityTypeId: Scalars['String']['output'];
  activityTypeName: Scalars['String']['output'];
  completedTodos: Scalars['Int']['output'];
  totalHabits: Scalars['Int']['output'];
  totalTodos: Scalars['Int']['output'];
};

export type ApiKey = {
  __typename?: 'ApiKey';
  /** DateTime */
  createdAt: Scalars['DateTime']['output'];
  /** DateTime */
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  keyHash: Scalars['String']['output'];
  keyPrefix: Scalars['String']['output'];
  /** DateTime */
  lastUsedAt: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  /** DateTime */
  revokedAt: Maybe<Scalars['DateTime']['output']>;
  scopes: Array<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Scalars['String']['output'];
};


export type ApiKeyUserArgs = {
  where?: InputMaybe<UserFilters>;
};

export type ApiKeyFilters = {
  OR?: InputMaybe<Array<ApiKeyFiltersOr>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  expiresAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<IdFilter>;
  keyHash?: InputMaybe<StringFilter>;
  keyPrefix?: InputMaybe<StringFilter>;
  lastUsedAt?: InputMaybe<DateTimeFilter>;
  name?: InputMaybe<StringFilter>;
  revokedAt?: InputMaybe<DateTimeFilter>;
  scopes?: InputMaybe<StringFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type ApiKeyFiltersOr = {
  createdAt?: InputMaybe<DateTimeFilter>;
  expiresAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<IdFilter>;
  keyHash?: InputMaybe<StringFilter>;
  keyPrefix?: InputMaybe<StringFilter>;
  lastUsedAt?: InputMaybe<DateTimeFilter>;
  name?: InputMaybe<StringFilter>;
  revokedAt?: InputMaybe<DateTimeFilter>;
  scopes?: InputMaybe<StringFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type ApiKeyOrderBy = {
  createdAt?: InputMaybe<InnerOrder>;
  expiresAt?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  keyHash?: InputMaybe<InnerOrder>;
  keyPrefix?: InputMaybe<InnerOrder>;
  lastUsedAt?: InputMaybe<InnerOrder>;
  name?: InputMaybe<InnerOrder>;
  revokedAt?: InputMaybe<InnerOrder>;
  scopes?: InputMaybe<InnerOrder>;
  userId?: InputMaybe<InnerOrder>;
};

export type BooleanFilter = {
  OR?: InputMaybe<Array<BooleanFilterOr>>;
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  gt?: InputMaybe<Scalars['Boolean']['input']>;
  gte?: InputMaybe<Scalars['Boolean']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Boolean']['input']>;
  lte?: InputMaybe<Scalars['Boolean']['input']>;
  ne?: InputMaybe<Scalars['Boolean']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type BooleanFilterOr = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  gt?: InputMaybe<Scalars['Boolean']['input']>;
  gte?: InputMaybe<Scalars['Boolean']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['Boolean']['input']>;
  lte?: InputMaybe<Scalars['Boolean']['input']>;
  ne?: InputMaybe<Scalars['Boolean']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type CompleteHabitArgs = {
  completedAt?: InputMaybe<Scalars['String']['input']>;
  habitId: Scalars['ID']['input'];
  scheduledAt?: InputMaybe<Scalars['String']['input']>;
};

export type CreateActivityTypeArgs = {
  color?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateActivityTypeInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateApiKeyInput = {
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  keyHash: Scalars['String']['input'];
  keyPrefix: Scalars['String']['input'];
  /** DateTime */
  lastUsedAt?: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  /** DateTime */
  revokedAt?: InputMaybe<Scalars['DateTime']['input']>;
  scopes: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateApiKeyResult = {
  __typename?: 'CreateApiKeyResult';
  apiKey: ApiKey;
  token: Scalars['String']['output'];
};

export type CreateHabitArgs = {
  activityTypeId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedLength?: InputMaybe<Scalars['Int']['input']>;
  frequencyCount: Scalars['Int']['input'];
  frequencyUnit: Scalars['String']['input'];
  minTimeBetweenInstances?: InputMaybe<Scalars['Int']['input']>;
  pomodoroEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  pomodoroLongBreakLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroShortBreakLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroUnitLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroUnitsBeforeLongBreak?: InputMaybe<Scalars['Int']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  title: Scalars['String']['input'];
};

export type CreateHabitCompletionInput = {
  /** DateTime */
  completedAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  habitId: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  scheduledAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type CreateHabitInput = {
  activityTypeId: Scalars['String']['input'];
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedLength: Scalars['Int']['input'];
  frequencyCount: Scalars['Int']['input'];
  frequencyUnit: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  minTimeBetweenInstances?: InputMaybe<Scalars['Int']['input']>;
  pomodoroEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  pomodoroLongBreakLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroShortBreakLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroUnitLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroUnitsBeforeLongBreak?: InputMaybe<Scalars['Int']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  title: Scalars['String']['input'];
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateTimeBlockArgs = {
  activityTypeId: Scalars['ID']['input'];
  daysOfWeek: Array<Scalars['Int']['input']>;
  endTime: Scalars['String']['input'];
  priority?: InputMaybe<Scalars['Int']['input']>;
  startTime: Scalars['String']['input'];
};

export type CreateTimeBlockInput = {
  activityTypeId: Scalars['String']['input'];
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  daysOfWeek: Array<Scalars['Int']['input']>;
  endTime: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  startTime: Scalars['String']['input'];
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateTodoArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueAt?: InputMaybe<Scalars['String']['input']>;
  estimatedLength?: InputMaybe<Scalars['Int']['input']>;
  listId: Scalars['ID']['input'];
  priority?: InputMaybe<Scalars['Int']['input']>;
  scheduledAt?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreateTodoInput = {
  /** DateTime */
  completedAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  dueAt?: InputMaybe<Scalars['DateTime']['input']>;
  estimatedLength: Scalars['Int']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  listId: Scalars['String']['input'];
  manuallyScheduled?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  /** DateTime */
  scheduledAt?: InputMaybe<Scalars['DateTime']['input']>;
  title: Scalars['String']['input'];
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateTodoListArgs = {
  activityTypeId: Scalars['ID']['input'];
  defaultEstimatedLength?: InputMaybe<Scalars['Int']['input']>;
  defaultPriority?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateTodoListInput = {
  activityTypeId: Scalars['String']['input'];
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  defaultEstimatedLength?: InputMaybe<Scalars['Int']['input']>;
  defaultPriority?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateUserInput = {
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  email: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type DateTimeFilter = {
  OR?: InputMaybe<Array<DateTimeFilterOr>>;
  /** DateTime */
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<DateTime> */
  inArray?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  ne?: InputMaybe<Scalars['DateTime']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<DateTime> */
  notInArray?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type DateTimeFilterOr = {
  /** DateTime */
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<DateTime> */
  inArray?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  ne?: InputMaybe<Scalars['DateTime']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<DateTime> */
  notInArray?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type FloatArrayFilter = {
  OR?: InputMaybe<Array<FloatArrayFilterOr>>;
  eq?: InputMaybe<Array<Scalars['Int']['input']>>;
  gt?: InputMaybe<Array<Scalars['Int']['input']>>;
  gte?: InputMaybe<Array<Scalars['Int']['input']>>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Array<Scalars['Int']['input']>>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Array<Scalars['Int']['input']>>;
  lte?: InputMaybe<Array<Scalars['Int']['input']>>;
  ne?: InputMaybe<Array<Scalars['Int']['input']>>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Array<Scalars['Int']['input']>>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type FloatArrayFilterOr = {
  eq?: InputMaybe<Array<Scalars['Int']['input']>>;
  gt?: InputMaybe<Array<Scalars['Int']['input']>>;
  gte?: InputMaybe<Array<Scalars['Int']['input']>>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Array<Scalars['Int']['input']>>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Array<Scalars['Int']['input']>>;
  lte?: InputMaybe<Array<Scalars['Int']['input']>>;
  ne?: InputMaybe<Array<Scalars['Int']['input']>>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Array<Scalars['Int']['input']>>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type Habit = {
  __typename?: 'Habit';
  activityType: Maybe<ActivityType>;
  activityTypeId: Scalars['String']['output'];
  completions: Array<HabitCompletion>;
  /** DateTime */
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  estimatedLength: Scalars['Int']['output'];
  frequencyCount: Scalars['Int']['output'];
  frequencyUnit: Scalars['String']['output'];
  id: Scalars['String']['output'];
  minTimeBetweenInstances: Maybe<Scalars['Int']['output']>;
  pomodoroEnabled: Scalars['Boolean']['output'];
  pomodoroLongBreakLength: Maybe<Scalars['Int']['output']>;
  pomodoroShortBreakLength: Maybe<Scalars['Int']['output']>;
  pomodoroUnitLength: Maybe<Scalars['Int']['output']>;
  pomodoroUnitsBeforeLongBreak: Maybe<Scalars['Int']['output']>;
  priority: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  /** DateTime */
  updatedAt: Scalars['DateTime']['output'];
  user: Maybe<User>;
  userId: Scalars['String']['output'];
};


export type HabitActivityTypeArgs = {
  where?: InputMaybe<ActivityTypeFilters>;
};


export type HabitCompletionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HabitCompletionOrderBy>;
  where?: InputMaybe<HabitCompletionFilters>;
};


export type HabitUserArgs = {
  where?: InputMaybe<UserFilters>;
};

export type HabitCompletion = {
  __typename?: 'HabitCompletion';
  /** DateTime */
  completedAt: Maybe<Scalars['DateTime']['output']>;
  /** DateTime */
  createdAt: Scalars['DateTime']['output'];
  habit: Maybe<Habit>;
  habitId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  /** DateTime */
  scheduledAt: Maybe<Scalars['DateTime']['output']>;
};


export type HabitCompletionHabitArgs = {
  where?: InputMaybe<HabitFilters>;
};

export type HabitCompletionFilters = {
  OR?: InputMaybe<Array<HabitCompletionFiltersOr>>;
  completedAt?: InputMaybe<DateTimeFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  habitId?: InputMaybe<IdFilter>;
  id?: InputMaybe<IdFilter>;
  scheduledAt?: InputMaybe<DateTimeFilter>;
};

export type HabitCompletionFiltersOr = {
  completedAt?: InputMaybe<DateTimeFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  habitId?: InputMaybe<IdFilter>;
  id?: InputMaybe<IdFilter>;
  scheduledAt?: InputMaybe<DateTimeFilter>;
};

export type HabitCompletionOrderBy = {
  completedAt?: InputMaybe<InnerOrder>;
  createdAt?: InputMaybe<InnerOrder>;
  habitId?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  scheduledAt?: InputMaybe<InnerOrder>;
};

export type HabitDetail = {
  __typename?: 'HabitDetail';
  activityType: Maybe<ActivityType>;
  allTimeRate: Scalars['Float']['output'];
  description: Maybe<Scalars['String']['output']>;
  estimatedLength: Scalars['Int']['output'];
  frequencyCount: Scalars['Int']['output'];
  frequencyUnit: Scalars['String']['output'];
  habitId: Scalars['ID']['output'];
  periods: Array<HabitPeriod>;
  priority: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  totalCompletions: Scalars['Int']['output'];
};

export type HabitFilters = {
  OR?: InputMaybe<Array<HabitFiltersOr>>;
  activityTypeId?: InputMaybe<IdFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  description?: InputMaybe<StringFilter>;
  estimatedLength?: InputMaybe<StringFilter>;
  frequencyCount?: InputMaybe<StringFilter>;
  frequencyUnit?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  minTimeBetweenInstances?: InputMaybe<StringFilter>;
  pomodoroEnabled?: InputMaybe<BooleanFilter>;
  pomodoroLongBreakLength?: InputMaybe<StringFilter>;
  pomodoroShortBreakLength?: InputMaybe<StringFilter>;
  pomodoroUnitLength?: InputMaybe<StringFilter>;
  pomodoroUnitsBeforeLongBreak?: InputMaybe<StringFilter>;
  priority?: InputMaybe<StringFilter>;
  title?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type HabitFiltersOr = {
  activityTypeId?: InputMaybe<IdFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  description?: InputMaybe<StringFilter>;
  estimatedLength?: InputMaybe<StringFilter>;
  frequencyCount?: InputMaybe<StringFilter>;
  frequencyUnit?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  minTimeBetweenInstances?: InputMaybe<StringFilter>;
  pomodoroEnabled?: InputMaybe<BooleanFilter>;
  pomodoroLongBreakLength?: InputMaybe<StringFilter>;
  pomodoroShortBreakLength?: InputMaybe<StringFilter>;
  pomodoroUnitLength?: InputMaybe<StringFilter>;
  pomodoroUnitsBeforeLongBreak?: InputMaybe<StringFilter>;
  priority?: InputMaybe<StringFilter>;
  title?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type HabitOrderBy = {
  activityTypeId?: InputMaybe<InnerOrder>;
  createdAt?: InputMaybe<InnerOrder>;
  description?: InputMaybe<InnerOrder>;
  estimatedLength?: InputMaybe<InnerOrder>;
  frequencyCount?: InputMaybe<InnerOrder>;
  frequencyUnit?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  minTimeBetweenInstances?: InputMaybe<InnerOrder>;
  pomodoroEnabled?: InputMaybe<InnerOrder>;
  pomodoroLongBreakLength?: InputMaybe<InnerOrder>;
  pomodoroShortBreakLength?: InputMaybe<InnerOrder>;
  pomodoroUnitLength?: InputMaybe<InnerOrder>;
  pomodoroUnitsBeforeLongBreak?: InputMaybe<InnerOrder>;
  priority?: InputMaybe<InnerOrder>;
  title?: InputMaybe<InnerOrder>;
  updatedAt?: InputMaybe<InnerOrder>;
  userId?: InputMaybe<InnerOrder>;
};

export type HabitPeriod = {
  __typename?: 'HabitPeriod';
  completions: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  periodEnd: Scalars['String']['output'];
  periodStart: Scalars['String']['output'];
  rate: Scalars['Float']['output'];
  target: Scalars['Int']['output'];
};

export type HabitStatSummary = {
  __typename?: 'HabitStatSummary';
  activityType: Maybe<ActivityType>;
  completionRate: Scalars['Float']['output'];
  completions: Scalars['Int']['output'];
  frequencyCount: Scalars['Int']['output'];
  frequencyUnit: Scalars['String']['output'];
  habitId: Scalars['ID']['output'];
  target: Scalars['Float']['output'];
  title: Scalars['String']['output'];
};

export type HabitStats = {
  __typename?: 'HabitStats';
  completionRate: Scalars['Float']['output'];
  habitId: Scalars['String']['output'];
  title: Scalars['String']['output'];
  totalCompletions: Scalars['Int']['output'];
};

export type IdFilter = {
  OR?: InputMaybe<Array<IdFilterOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type IdFilterOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type InnerOrder = {
  direction: OrderDirection;
  /** Priority of current field */
  priority: Scalars['Int']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createActivityType: Maybe<ActivityType>;
  createActivityTypes: Array<ActivityType>;
  createApiKey: Maybe<ApiKey>;
  createApiKeys: Array<ApiKey>;
  createHabit: Maybe<Habit>;
  createHabitCompletion: Maybe<HabitCompletion>;
  createHabitCompletions: Array<HabitCompletion>;
  createHabits: Array<Habit>;
  createTimeBlock: Maybe<TimeBlock>;
  createTimeBlocks: Array<TimeBlock>;
  createTodo: Maybe<Todo>;
  createTodoList: Maybe<TodoList>;
  createTodoLists: Array<TodoList>;
  createTodos: Array<Todo>;
  createUser: Maybe<User>;
  createUsers: Array<User>;
  deleteActivityTypes: Array<ActivityType>;
  deleteApiKeys: Array<ApiKey>;
  deleteHabitCompletions: Array<HabitCompletion>;
  deleteHabits: Array<Habit>;
  deleteTimeBlocks: Array<TimeBlock>;
  deleteTodoLists: Array<TodoList>;
  deleteTodos: Array<Todo>;
  deleteUsers: Array<User>;
  myCompleteHabit: HabitCompletion;
  myCompleteTodo: Todo;
  myCreateActivityType: ActivityType;
  myCreateApiKey: CreateApiKeyResult;
  myCreateHabit: Habit;
  myCreateTimeBlock: TimeBlock;
  myCreateTodo: Todo;
  myCreateTodoList: TodoList;
  myDeleteActivityType: Scalars['Boolean']['output'];
  myDeleteHabit: Scalars['Boolean']['output'];
  myDeleteTimeBlock: Scalars['Boolean']['output'];
  myDeleteTodo: Scalars['Boolean']['output'];
  myDeleteTodoList: Scalars['Boolean']['output'];
  myReschedule: Scalars['Boolean']['output'];
  myRevokeApiKey: Scalars['Boolean']['output'];
  myUncompleteHabit: Scalars['Boolean']['output'];
  myUpdateActivityType: ActivityType;
  myUpdateHabit: Habit;
  myUpdateProfile: Scalars['Boolean']['output'];
  myUpdateTimeBlock: TimeBlock;
  myUpdateTodo: Todo;
  myUpdateTodoList: TodoList;
  requestMagicLink: RequestMagicLinkResult;
  updateActivityTypes: Array<ActivityType>;
  updateApiKeys: Array<ApiKey>;
  updateHabitCompletions: Array<HabitCompletion>;
  updateHabits: Array<Habit>;
  updateTimeBlocks: Array<TimeBlock>;
  updateTodoLists: Array<TodoList>;
  updateTodos: Array<Todo>;
  updateUsers: Array<User>;
  verifyMagicLink: VerifyMagicLinkResult;
};


export type MutationCreateActivityTypeArgs = {
  values: CreateActivityTypeInput;
};


export type MutationCreateActivityTypesArgs = {
  values: Array<CreateActivityTypeInput>;
};


export type MutationCreateApiKeyArgs = {
  values: CreateApiKeyInput;
};


export type MutationCreateApiKeysArgs = {
  values: Array<CreateApiKeyInput>;
};


export type MutationCreateHabitArgs = {
  values: CreateHabitInput;
};


export type MutationCreateHabitCompletionArgs = {
  values: CreateHabitCompletionInput;
};


export type MutationCreateHabitCompletionsArgs = {
  values: Array<CreateHabitCompletionInput>;
};


export type MutationCreateHabitsArgs = {
  values: Array<CreateHabitInput>;
};


export type MutationCreateTimeBlockArgs = {
  values: CreateTimeBlockInput;
};


export type MutationCreateTimeBlocksArgs = {
  values: Array<CreateTimeBlockInput>;
};


export type MutationCreateTodoArgs = {
  values: CreateTodoInput;
};


export type MutationCreateTodoListArgs = {
  values: CreateTodoListInput;
};


export type MutationCreateTodoListsArgs = {
  values: Array<CreateTodoListInput>;
};


export type MutationCreateTodosArgs = {
  values: Array<CreateTodoInput>;
};


export type MutationCreateUserArgs = {
  values: CreateUserInput;
};


export type MutationCreateUsersArgs = {
  values: Array<CreateUserInput>;
};


export type MutationDeleteActivityTypesArgs = {
  where?: InputMaybe<ActivityTypeFilters>;
};


export type MutationDeleteApiKeysArgs = {
  where?: InputMaybe<ApiKeyFilters>;
};


export type MutationDeleteHabitCompletionsArgs = {
  where?: InputMaybe<HabitCompletionFilters>;
};


export type MutationDeleteHabitsArgs = {
  where?: InputMaybe<HabitFilters>;
};


export type MutationDeleteTimeBlocksArgs = {
  where?: InputMaybe<TimeBlockFilters>;
};


export type MutationDeleteTodoListsArgs = {
  where?: InputMaybe<TodoListFilters>;
};


export type MutationDeleteTodosArgs = {
  where?: InputMaybe<TodoFilters>;
};


export type MutationDeleteUsersArgs = {
  where?: InputMaybe<UserFilters>;
};


export type MutationMyCompleteHabitArgs = {
  input: CompleteHabitArgs;
};


export type MutationMyCompleteTodoArgs = {
  completedAt?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
};


export type MutationMyCreateActivityTypeArgs = {
  input: CreateActivityTypeArgs;
};


export type MutationMyCreateApiKeyArgs = {
  input: MyCreateApiKeyInput;
};


export type MutationMyCreateHabitArgs = {
  input: CreateHabitArgs;
};


export type MutationMyCreateTimeBlockArgs = {
  input: CreateTimeBlockArgs;
};


export type MutationMyCreateTodoArgs = {
  input: CreateTodoArgs;
};


export type MutationMyCreateTodoListArgs = {
  input: CreateTodoListArgs;
};


export type MutationMyDeleteActivityTypeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMyDeleteHabitArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMyDeleteTimeBlockArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMyDeleteTodoArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMyDeleteTodoListArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMyRescheduleArgs = {
  weekStart?: InputMaybe<Scalars['String']['input']>;
};


export type MutationMyRevokeApiKeyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMyUncompleteHabitArgs = {
  completionId: Scalars['ID']['input'];
};


export type MutationMyUpdateActivityTypeArgs = {
  input: UpdateActivityTypeArgs;
};


export type MutationMyUpdateHabitArgs = {
  input: UpdateHabitArgs;
};


export type MutationMyUpdateProfileArgs = {
  timezone: Scalars['String']['input'];
};


export type MutationMyUpdateTimeBlockArgs = {
  input: UpdateTimeBlockArgs;
};


export type MutationMyUpdateTodoArgs = {
  input: UpdateTodoArgs;
};


export type MutationMyUpdateTodoListArgs = {
  input: UpdateTodoListArgs;
};


export type MutationRequestMagicLinkArgs = {
  email: Scalars['String']['input'];
};


export type MutationUpdateActivityTypesArgs = {
  set: UpdateActivityTypeInput;
  where?: InputMaybe<ActivityTypeFilters>;
};


export type MutationUpdateApiKeysArgs = {
  set: UpdateApiKeyInput;
  where?: InputMaybe<ApiKeyFilters>;
};


export type MutationUpdateHabitCompletionsArgs = {
  set: UpdateHabitCompletionInput;
  where?: InputMaybe<HabitCompletionFilters>;
};


export type MutationUpdateHabitsArgs = {
  set: UpdateHabitInput;
  where?: InputMaybe<HabitFilters>;
};


export type MutationUpdateTimeBlocksArgs = {
  set: UpdateTimeBlockInput;
  where?: InputMaybe<TimeBlockFilters>;
};


export type MutationUpdateTodoListsArgs = {
  set: UpdateTodoListInput;
  where?: InputMaybe<TodoListFilters>;
};


export type MutationUpdateTodosArgs = {
  set: UpdateTodoInput;
  where?: InputMaybe<TodoFilters>;
};


export type MutationUpdateUsersArgs = {
  set: UpdateUserInput;
  where?: InputMaybe<UserFilters>;
};


export type MutationVerifyMagicLinkArgs = {
  token: Scalars['String']['input'];
};

export type MyCreateApiKeyInput = {
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  scopes: Array<Scalars['String']['input']>;
};

/** Order by direction */
export enum OrderDirection {
  /** Ascending order */
  Asc = 'asc',
  /** Descending order */
  Desc = 'desc'
}

export type Query = {
  __typename?: 'Query';
  activityType: Maybe<ActivityType>;
  activityTypeStats: Array<ActivityTypeStats>;
  activityTypes: Array<ActivityType>;
  apiKey: Maybe<ApiKey>;
  apiKeys: Array<ApiKey>;
  habit: Maybe<Habit>;
  habitCompletion: Maybe<HabitCompletion>;
  habitCompletions: Array<HabitCompletion>;
  habitStats: Array<HabitStats>;
  habits: Array<Habit>;
  myActivityTypes: Array<ActivityType>;
  myApiKeys: Array<ApiKey>;
  myHabitDetail: HabitDetail;
  myHabits: Array<Habit>;
  myProfile: Maybe<UserProfile>;
  mySchedule: Array<ScheduledItem>;
  myStats: StatsOverview;
  myTimeBlocks: Array<TimeBlock>;
  myTodoLists: Array<TodoList>;
  myTodos: Array<Todo>;
  timeBlock: Maybe<TimeBlock>;
  timeBlocks: Array<TimeBlock>;
  todo: Maybe<Todo>;
  todoList: Maybe<TodoList>;
  todoLists: Array<TodoList>;
  todos: Array<Todo>;
  user: Maybe<User>;
  users: Array<User>;
};


export type QueryActivityTypeArgs = {
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ActivityTypeOrderBy>;
  where?: InputMaybe<ActivityTypeFilters>;
};


export type QueryActivityTypeStatsArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryActivityTypesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ActivityTypeOrderBy>;
  where?: InputMaybe<ActivityTypeFilters>;
};


export type QueryApiKeyArgs = {
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ApiKeyOrderBy>;
  where?: InputMaybe<ApiKeyFilters>;
};


export type QueryApiKeysArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ApiKeyOrderBy>;
  where?: InputMaybe<ApiKeyFilters>;
};


export type QueryHabitArgs = {
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HabitOrderBy>;
  where?: InputMaybe<HabitFilters>;
};


export type QueryHabitCompletionArgs = {
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HabitCompletionOrderBy>;
  where?: InputMaybe<HabitCompletionFilters>;
};


export type QueryHabitCompletionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HabitCompletionOrderBy>;
  where?: InputMaybe<HabitCompletionFilters>;
};


export type QueryHabitStatsArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  habitId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryHabitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HabitOrderBy>;
  where?: InputMaybe<HabitFilters>;
};


export type QueryMyHabitDetailArgs = {
  habitId: Scalars['ID']['input'];
  periods?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMyHabitsArgs = {
  activityTypeId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryMyScheduleArgs = {
  timezone?: InputMaybe<Scalars['String']['input']>;
  weekStart?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyStatsArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyTimeBlocksArgs = {
  activityTypeId?: InputMaybe<Scalars['ID']['input']>;
  containsDay?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMyTodosArgs = {
  completed?: InputMaybe<Scalars['Boolean']['input']>;
  listId?: InputMaybe<Scalars['ID']['input']>;
  orderBy?: InputMaybe<TodoOrderBy>;
};


export type QueryTimeBlockArgs = {
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TimeBlockOrderBy>;
  where?: InputMaybe<TimeBlockFilters>;
};


export type QueryTimeBlocksArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TimeBlockOrderBy>;
  where?: InputMaybe<TimeBlockFilters>;
};


export type QueryTodoArgs = {
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TodoOrderBy>;
  where?: InputMaybe<TodoFilters>;
};


export type QueryTodoListArgs = {
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TodoListOrderBy>;
  where?: InputMaybe<TodoListFilters>;
};


export type QueryTodoListsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TodoListOrderBy>;
  where?: InputMaybe<TodoListFilters>;
};


export type QueryTodosArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TodoOrderBy>;
  where?: InputMaybe<TodoFilters>;
};


export type QueryUserArgs = {
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UserOrderBy>;
  where?: InputMaybe<UserFilters>;
};


export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UserOrderBy>;
  where?: InputMaybe<UserFilters>;
};

export type RequestMagicLinkResult = {
  __typename?: 'RequestMagicLinkResult';
  magicLink: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type ScheduledItem = {
  __typename?: 'ScheduledItem';
  activityType: Maybe<ActivityType>;
  completedAt: Maybe<Scalars['String']['output']>;
  estimatedLength: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  isOverdue: Scalars['Boolean']['output'];
  isScheduled: Scalars['Boolean']['output'];
  kind: ScheduledItemKind;
  priority: Scalars['Int']['output'];
  scheduledEnd: Maybe<Scalars['String']['output']>;
  scheduledStart: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export enum ScheduledItemKind {
  Habit = 'habit',
  Pomodoro = 'pomodoro',
  Todo = 'todo'
}

export type StatsOverview = {
  __typename?: 'StatsOverview';
  habitScore: Maybe<Scalars['Float']['output']>;
  habits: Array<HabitStatSummary>;
  todoScore: Maybe<Scalars['Float']['output']>;
  todos: TodoStatSummary;
  weightedScore: Maybe<Scalars['Float']['output']>;
};

export type StringFilter = {
  OR?: InputMaybe<Array<StringFilterOr>>;
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type StringFilterOr = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  inArray?: InputMaybe<Array<Scalars['String']['input']>>;
  isNotNull?: InputMaybe<Scalars['Boolean']['input']>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIlike?: InputMaybe<Scalars['String']['input']>;
  /** Array<undefined> */
  notInArray?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  myTodoListsUpdated: TodoListEvent;
  myTodosUpdated: TodoEvent;
};

export type TimeBlock = {
  __typename?: 'TimeBlock';
  activityType: Maybe<ActivityType>;
  activityTypeId: Scalars['String']['output'];
  /** DateTime */
  createdAt: Scalars['DateTime']['output'];
  daysOfWeek: Array<Scalars['Int']['output']>;
  endTime: Scalars['String']['output'];
  id: Scalars['String']['output'];
  priority: Scalars['Int']['output'];
  startTime: Scalars['String']['output'];
  /** DateTime */
  updatedAt: Scalars['DateTime']['output'];
  user: Maybe<User>;
  userId: Scalars['String']['output'];
};


export type TimeBlockActivityTypeArgs = {
  where?: InputMaybe<ActivityTypeFilters>;
};


export type TimeBlockUserArgs = {
  where?: InputMaybe<UserFilters>;
};

export type TimeBlockFilters = {
  OR?: InputMaybe<Array<TimeBlockFiltersOr>>;
  activityTypeId?: InputMaybe<IdFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  daysOfWeek?: InputMaybe<FloatArrayFilter>;
  endTime?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  priority?: InputMaybe<StringFilter>;
  startTime?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type TimeBlockFiltersOr = {
  activityTypeId?: InputMaybe<IdFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  daysOfWeek?: InputMaybe<FloatArrayFilter>;
  endTime?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  priority?: InputMaybe<StringFilter>;
  startTime?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type TimeBlockOrderBy = {
  activityTypeId?: InputMaybe<InnerOrder>;
  createdAt?: InputMaybe<InnerOrder>;
  daysOfWeek?: InputMaybe<InnerOrder>;
  endTime?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  priority?: InputMaybe<InnerOrder>;
  startTime?: InputMaybe<InnerOrder>;
  updatedAt?: InputMaybe<InnerOrder>;
  userId?: InputMaybe<InnerOrder>;
};

export type Todo = {
  __typename?: 'Todo';
  activityType: Maybe<ActivityType>;
  /** DateTime */
  completedAt: Maybe<Scalars['DateTime']['output']>;
  /** DateTime */
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  /** DateTime */
  dueAt: Maybe<Scalars['DateTime']['output']>;
  estimatedLength: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  list: Maybe<TodoList>;
  listId: Scalars['String']['output'];
  manuallyScheduled: Scalars['Boolean']['output'];
  priority: Scalars['Int']['output'];
  /** DateTime */
  scheduledAt: Maybe<Scalars['DateTime']['output']>;
  title: Scalars['String']['output'];
  /** DateTime */
  updatedAt: Scalars['DateTime']['output'];
  user: Maybe<User>;
  userId: Scalars['String']['output'];
};


export type TodoListArgs = {
  where?: InputMaybe<TodoListFilters>;
};


export type TodoUserArgs = {
  where?: InputMaybe<UserFilters>;
};

export type TodoEvent = {
  __typename?: 'TodoEvent';
  deletedId: Maybe<Scalars['ID']['output']>;
  todo: Maybe<Todo>;
  type: TodoEventType;
};

export enum TodoEventType {
  Created = 'created',
  Deleted = 'deleted',
  Updated = 'updated'
}

export type TodoFilters = {
  OR?: InputMaybe<Array<TodoFiltersOr>>;
  completedAt?: InputMaybe<DateTimeFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  description?: InputMaybe<StringFilter>;
  dueAt?: InputMaybe<DateTimeFilter>;
  estimatedLength?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  listId?: InputMaybe<IdFilter>;
  manuallyScheduled?: InputMaybe<BooleanFilter>;
  priority?: InputMaybe<StringFilter>;
  scheduledAt?: InputMaybe<DateTimeFilter>;
  title?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type TodoFiltersOr = {
  completedAt?: InputMaybe<DateTimeFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  description?: InputMaybe<StringFilter>;
  dueAt?: InputMaybe<DateTimeFilter>;
  estimatedLength?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  listId?: InputMaybe<IdFilter>;
  manuallyScheduled?: InputMaybe<BooleanFilter>;
  priority?: InputMaybe<StringFilter>;
  scheduledAt?: InputMaybe<DateTimeFilter>;
  title?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type TodoList = {
  __typename?: 'TodoList';
  activityType: Maybe<ActivityType>;
  activityTypeId: Scalars['String']['output'];
  /** DateTime */
  createdAt: Scalars['DateTime']['output'];
  defaultEstimatedLength: Scalars['Int']['output'];
  defaultPriority: Scalars['Int']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  todos: Array<Todo>;
  /** DateTime */
  updatedAt: Scalars['DateTime']['output'];
  user: Maybe<User>;
  userId: Scalars['String']['output'];
};


export type TodoListActivityTypeArgs = {
  where?: InputMaybe<ActivityTypeFilters>;
};


export type TodoListTodosArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TodoOrderBy>;
  where?: InputMaybe<TodoFilters>;
};


export type TodoListUserArgs = {
  where?: InputMaybe<UserFilters>;
};

export type TodoListEvent = {
  __typename?: 'TodoListEvent';
  deletedId: Maybe<Scalars['ID']['output']>;
  todoList: Maybe<TodoList>;
  type: TodoEventType;
};

export type TodoListFilters = {
  OR?: InputMaybe<Array<TodoListFiltersOr>>;
  activityTypeId?: InputMaybe<IdFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  defaultEstimatedLength?: InputMaybe<StringFilter>;
  defaultPriority?: InputMaybe<StringFilter>;
  description?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  name?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type TodoListFiltersOr = {
  activityTypeId?: InputMaybe<IdFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  defaultEstimatedLength?: InputMaybe<StringFilter>;
  defaultPriority?: InputMaybe<StringFilter>;
  description?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  name?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  userId?: InputMaybe<IdFilter>;
};

export type TodoListOrderBy = {
  activityTypeId?: InputMaybe<InnerOrder>;
  createdAt?: InputMaybe<InnerOrder>;
  defaultEstimatedLength?: InputMaybe<InnerOrder>;
  defaultPriority?: InputMaybe<InnerOrder>;
  description?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  name?: InputMaybe<InnerOrder>;
  updatedAt?: InputMaybe<InnerOrder>;
  userId?: InputMaybe<InnerOrder>;
};

export type TodoOrderBy = {
  completedAt?: InputMaybe<InnerOrder>;
  createdAt?: InputMaybe<InnerOrder>;
  description?: InputMaybe<InnerOrder>;
  dueAt?: InputMaybe<InnerOrder>;
  estimatedLength?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  listId?: InputMaybe<InnerOrder>;
  manuallyScheduled?: InputMaybe<InnerOrder>;
  priority?: InputMaybe<InnerOrder>;
  scheduledAt?: InputMaybe<InnerOrder>;
  title?: InputMaybe<InnerOrder>;
  updatedAt?: InputMaybe<InnerOrder>;
  userId?: InputMaybe<InnerOrder>;
};

export type TodoStatSummary = {
  __typename?: 'TodoStatSummary';
  completed: Scalars['Int']['output'];
  completionRate: Scalars['Float']['output'];
  overdue: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type UpdateActivityTypeArgs = {
  color?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateActivityTypeInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateApiKeyInput = {
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  keyHash?: InputMaybe<Scalars['String']['input']>;
  keyPrefix?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  lastUsedAt?: InputMaybe<Scalars['DateTime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  revokedAt?: InputMaybe<Scalars['DateTime']['input']>;
  scopes?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateHabitArgs = {
  activityTypeId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedLength?: InputMaybe<Scalars['Int']['input']>;
  frequencyCount?: InputMaybe<Scalars['Int']['input']>;
  frequencyUnit?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  minTimeBetweenInstances?: InputMaybe<Scalars['Int']['input']>;
  pomodoroEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  pomodoroLongBreakLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroShortBreakLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroUnitLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroUnitsBeforeLongBreak?: InputMaybe<Scalars['Int']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateHabitCompletionInput = {
  /** DateTime */
  completedAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  habitId?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  scheduledAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UpdateHabitInput = {
  activityTypeId?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedLength?: InputMaybe<Scalars['Int']['input']>;
  frequencyCount?: InputMaybe<Scalars['Int']['input']>;
  frequencyUnit?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  minTimeBetweenInstances?: InputMaybe<Scalars['Int']['input']>;
  pomodoroEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  pomodoroLongBreakLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroShortBreakLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroUnitLength?: InputMaybe<Scalars['Int']['input']>;
  pomodoroUnitsBeforeLongBreak?: InputMaybe<Scalars['Int']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTimeBlockArgs = {
  activityTypeId?: InputMaybe<Scalars['ID']['input']>;
  daysOfWeek?: InputMaybe<Array<Scalars['Int']['input']>>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  priority?: InputMaybe<Scalars['Int']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTimeBlockInput = {
  activityTypeId?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  daysOfWeek?: InputMaybe<Array<Scalars['Int']['input']>>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTodoArgs = {
  completedAt?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueAt?: InputMaybe<Scalars['String']['input']>;
  estimatedLength?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['ID']['input'];
  listId?: InputMaybe<Scalars['ID']['input']>;
  manuallyScheduled?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  scheduledAt?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTodoInput = {
  /** DateTime */
  completedAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  dueAt?: InputMaybe<Scalars['DateTime']['input']>;
  estimatedLength?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  listId?: InputMaybe<Scalars['String']['input']>;
  manuallyScheduled?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  /** DateTime */
  scheduledAt?: InputMaybe<Scalars['DateTime']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTodoListArgs = {
  activityTypeId?: InputMaybe<Scalars['ID']['input']>;
  defaultEstimatedLength?: InputMaybe<Scalars['Int']['input']>;
  defaultPriority?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTodoListInput = {
  activityTypeId?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  defaultEstimatedLength?: InputMaybe<Scalars['Int']['input']>;
  defaultPriority?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  /** DateTime */
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  /** DateTime */
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type User = {
  __typename?: 'User';
  activityTypes: Array<ActivityType>;
  apiKeys: Array<ApiKey>;
  /** DateTime */
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  habits: Array<Habit>;
  id: Scalars['String']['output'];
  timeBlocks: Array<TimeBlock>;
  timezone: Scalars['String']['output'];
  todoLists: Array<TodoList>;
  todos: Array<Todo>;
  /** DateTime */
  updatedAt: Scalars['DateTime']['output'];
};


export type UserActivityTypesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ActivityTypeOrderBy>;
  where?: InputMaybe<ActivityTypeFilters>;
};


export type UserApiKeysArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ApiKeyOrderBy>;
  where?: InputMaybe<ApiKeyFilters>;
};


export type UserHabitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HabitOrderBy>;
  where?: InputMaybe<HabitFilters>;
};


export type UserTimeBlocksArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TimeBlockOrderBy>;
  where?: InputMaybe<TimeBlockFilters>;
};


export type UserTodoListsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TodoListOrderBy>;
  where?: InputMaybe<TodoListFilters>;
};


export type UserTodosArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TodoOrderBy>;
  where?: InputMaybe<TodoFilters>;
};

export type UserFilters = {
  OR?: InputMaybe<Array<UserFiltersOr>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  email?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  timezone?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type UserFiltersOr = {
  createdAt?: InputMaybe<DateTimeFilter>;
  email?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  timezone?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type UserOrderBy = {
  createdAt?: InputMaybe<InnerOrder>;
  email?: InputMaybe<InnerOrder>;
  id?: InputMaybe<InnerOrder>;
  timezone?: InputMaybe<InnerOrder>;
  updatedAt?: InputMaybe<InnerOrder>;
};

export type UserProfile = {
  __typename?: 'UserProfile';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  timezone: Scalars['String']['output'];
};

export type VerifyMagicLinkResult = {
  __typename?: 'VerifyMagicLinkResult';
  token: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ActivityType: ResolverTypeWrapper<ActivityType>;
  ActivityTypeFilters: ActivityTypeFilters;
  ActivityTypeFiltersOr: ActivityTypeFiltersOr;
  ActivityTypeOrderBy: ActivityTypeOrderBy;
  ActivityTypeStats: ResolverTypeWrapper<ActivityTypeStats>;
  ApiKey: ResolverTypeWrapper<ApiKey>;
  ApiKeyFilters: ApiKeyFilters;
  ApiKeyFiltersOr: ApiKeyFiltersOr;
  ApiKeyOrderBy: ApiKeyOrderBy;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BooleanFilter: BooleanFilter;
  BooleanFilterOr: BooleanFilterOr;
  CompleteHabitArgs: CompleteHabitArgs;
  CreateActivityTypeArgs: CreateActivityTypeArgs;
  CreateActivityTypeInput: CreateActivityTypeInput;
  CreateApiKeyInput: CreateApiKeyInput;
  CreateApiKeyResult: ResolverTypeWrapper<CreateApiKeyResult>;
  CreateHabitArgs: CreateHabitArgs;
  CreateHabitCompletionInput: CreateHabitCompletionInput;
  CreateHabitInput: CreateHabitInput;
  CreateTimeBlockArgs: CreateTimeBlockArgs;
  CreateTimeBlockInput: CreateTimeBlockInput;
  CreateTodoArgs: CreateTodoArgs;
  CreateTodoInput: CreateTodoInput;
  CreateTodoListArgs: CreateTodoListArgs;
  CreateTodoListInput: CreateTodoListInput;
  CreateUserInput: CreateUserInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  DateTimeFilter: DateTimeFilter;
  DateTimeFilterOr: DateTimeFilterOr;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  FloatArrayFilter: FloatArrayFilter;
  FloatArrayFilterOr: FloatArrayFilterOr;
  Habit: ResolverTypeWrapper<Habit>;
  HabitCompletion: ResolverTypeWrapper<HabitCompletion>;
  HabitCompletionFilters: HabitCompletionFilters;
  HabitCompletionFiltersOr: HabitCompletionFiltersOr;
  HabitCompletionOrderBy: HabitCompletionOrderBy;
  HabitDetail: ResolverTypeWrapper<HabitDetail>;
  HabitFilters: HabitFilters;
  HabitFiltersOr: HabitFiltersOr;
  HabitOrderBy: HabitOrderBy;
  HabitPeriod: ResolverTypeWrapper<HabitPeriod>;
  HabitStatSummary: ResolverTypeWrapper<HabitStatSummary>;
  HabitStats: ResolverTypeWrapper<HabitStats>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  IdFilter: IdFilter;
  IdFilterOr: IdFilterOr;
  InnerOrder: InnerOrder;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  MyCreateApiKeyInput: MyCreateApiKeyInput;
  OrderDirection: OrderDirection;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RequestMagicLinkResult: ResolverTypeWrapper<RequestMagicLinkResult>;
  ScheduledItem: ResolverTypeWrapper<ScheduledItem>;
  ScheduledItemKind: ScheduledItemKind;
  StatsOverview: ResolverTypeWrapper<StatsOverview>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  StringFilter: StringFilter;
  StringFilterOr: StringFilterOr;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  TimeBlock: ResolverTypeWrapper<TimeBlock>;
  TimeBlockFilters: TimeBlockFilters;
  TimeBlockFiltersOr: TimeBlockFiltersOr;
  TimeBlockOrderBy: TimeBlockOrderBy;
  Todo: ResolverTypeWrapper<Todo>;
  TodoEvent: ResolverTypeWrapper<TodoEvent>;
  TodoEventType: TodoEventType;
  TodoFilters: TodoFilters;
  TodoFiltersOr: TodoFiltersOr;
  TodoList: ResolverTypeWrapper<TodoList>;
  TodoListEvent: ResolverTypeWrapper<TodoListEvent>;
  TodoListFilters: TodoListFilters;
  TodoListFiltersOr: TodoListFiltersOr;
  TodoListOrderBy: TodoListOrderBy;
  TodoOrderBy: TodoOrderBy;
  TodoStatSummary: ResolverTypeWrapper<TodoStatSummary>;
  UpdateActivityTypeArgs: UpdateActivityTypeArgs;
  UpdateActivityTypeInput: UpdateActivityTypeInput;
  UpdateApiKeyInput: UpdateApiKeyInput;
  UpdateHabitArgs: UpdateHabitArgs;
  UpdateHabitCompletionInput: UpdateHabitCompletionInput;
  UpdateHabitInput: UpdateHabitInput;
  UpdateTimeBlockArgs: UpdateTimeBlockArgs;
  UpdateTimeBlockInput: UpdateTimeBlockInput;
  UpdateTodoArgs: UpdateTodoArgs;
  UpdateTodoInput: UpdateTodoInput;
  UpdateTodoListArgs: UpdateTodoListArgs;
  UpdateTodoListInput: UpdateTodoListInput;
  UpdateUserInput: UpdateUserInput;
  User: ResolverTypeWrapper<User>;
  UserFilters: UserFilters;
  UserFiltersOr: UserFiltersOr;
  UserOrderBy: UserOrderBy;
  UserProfile: ResolverTypeWrapper<UserProfile>;
  VerifyMagicLinkResult: ResolverTypeWrapper<VerifyMagicLinkResult>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  ActivityType: ActivityType;
  ActivityTypeFilters: ActivityTypeFilters;
  ActivityTypeFiltersOr: ActivityTypeFiltersOr;
  ActivityTypeOrderBy: ActivityTypeOrderBy;
  ActivityTypeStats: ActivityTypeStats;
  ApiKey: ApiKey;
  ApiKeyFilters: ApiKeyFilters;
  ApiKeyFiltersOr: ApiKeyFiltersOr;
  ApiKeyOrderBy: ApiKeyOrderBy;
  Boolean: Scalars['Boolean']['output'];
  BooleanFilter: BooleanFilter;
  BooleanFilterOr: BooleanFilterOr;
  CompleteHabitArgs: CompleteHabitArgs;
  CreateActivityTypeArgs: CreateActivityTypeArgs;
  CreateActivityTypeInput: CreateActivityTypeInput;
  CreateApiKeyInput: CreateApiKeyInput;
  CreateApiKeyResult: CreateApiKeyResult;
  CreateHabitArgs: CreateHabitArgs;
  CreateHabitCompletionInput: CreateHabitCompletionInput;
  CreateHabitInput: CreateHabitInput;
  CreateTimeBlockArgs: CreateTimeBlockArgs;
  CreateTimeBlockInput: CreateTimeBlockInput;
  CreateTodoArgs: CreateTodoArgs;
  CreateTodoInput: CreateTodoInput;
  CreateTodoListArgs: CreateTodoListArgs;
  CreateTodoListInput: CreateTodoListInput;
  CreateUserInput: CreateUserInput;
  DateTime: Scalars['DateTime']['output'];
  DateTimeFilter: DateTimeFilter;
  DateTimeFilterOr: DateTimeFilterOr;
  Float: Scalars['Float']['output'];
  FloatArrayFilter: FloatArrayFilter;
  FloatArrayFilterOr: FloatArrayFilterOr;
  Habit: Habit;
  HabitCompletion: HabitCompletion;
  HabitCompletionFilters: HabitCompletionFilters;
  HabitCompletionFiltersOr: HabitCompletionFiltersOr;
  HabitCompletionOrderBy: HabitCompletionOrderBy;
  HabitDetail: HabitDetail;
  HabitFilters: HabitFilters;
  HabitFiltersOr: HabitFiltersOr;
  HabitOrderBy: HabitOrderBy;
  HabitPeriod: HabitPeriod;
  HabitStatSummary: HabitStatSummary;
  HabitStats: HabitStats;
  ID: Scalars['ID']['output'];
  IdFilter: IdFilter;
  IdFilterOr: IdFilterOr;
  InnerOrder: InnerOrder;
  Int: Scalars['Int']['output'];
  Mutation: Record<PropertyKey, never>;
  MyCreateApiKeyInput: MyCreateApiKeyInput;
  Query: Record<PropertyKey, never>;
  RequestMagicLinkResult: RequestMagicLinkResult;
  ScheduledItem: ScheduledItem;
  StatsOverview: StatsOverview;
  String: Scalars['String']['output'];
  StringFilter: StringFilter;
  StringFilterOr: StringFilterOr;
  Subscription: Record<PropertyKey, never>;
  TimeBlock: TimeBlock;
  TimeBlockFilters: TimeBlockFilters;
  TimeBlockFiltersOr: TimeBlockFiltersOr;
  TimeBlockOrderBy: TimeBlockOrderBy;
  Todo: Todo;
  TodoEvent: TodoEvent;
  TodoFilters: TodoFilters;
  TodoFiltersOr: TodoFiltersOr;
  TodoList: TodoList;
  TodoListEvent: TodoListEvent;
  TodoListFilters: TodoListFilters;
  TodoListFiltersOr: TodoListFiltersOr;
  TodoListOrderBy: TodoListOrderBy;
  TodoOrderBy: TodoOrderBy;
  TodoStatSummary: TodoStatSummary;
  UpdateActivityTypeArgs: UpdateActivityTypeArgs;
  UpdateActivityTypeInput: UpdateActivityTypeInput;
  UpdateApiKeyInput: UpdateApiKeyInput;
  UpdateHabitArgs: UpdateHabitArgs;
  UpdateHabitCompletionInput: UpdateHabitCompletionInput;
  UpdateHabitInput: UpdateHabitInput;
  UpdateTimeBlockArgs: UpdateTimeBlockArgs;
  UpdateTimeBlockInput: UpdateTimeBlockInput;
  UpdateTodoArgs: UpdateTodoArgs;
  UpdateTodoInput: UpdateTodoInput;
  UpdateTodoListArgs: UpdateTodoListArgs;
  UpdateTodoListInput: UpdateTodoListInput;
  UpdateUserInput: UpdateUserInput;
  User: User;
  UserFilters: UserFilters;
  UserFiltersOr: UserFiltersOr;
  UserOrderBy: UserOrderBy;
  UserProfile: UserProfile;
  VerifyMagicLinkResult: VerifyMagicLinkResult;
};

export type ActivityTypeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ActivityType'] = ResolversParentTypes['ActivityType']> = {
  color?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  habits?: Resolver<Array<ResolversTypes['Habit']>, ParentType, ContextType, Partial<ActivityTypeHabitsArgs>>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timeBlocks?: Resolver<Array<ResolversTypes['TimeBlock']>, ParentType, ContextType, Partial<ActivityTypeTimeBlocksArgs>>;
  todoLists?: Resolver<Array<ResolversTypes['TodoList']>, ParentType, ContextType, Partial<ActivityTypeTodoListsArgs>>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<ActivityTypeUserArgs>>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ActivityTypeStatsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ActivityTypeStats'] = ResolversParentTypes['ActivityTypeStats']> = {
  activityTypeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  activityTypeName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  completedTodos?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalHabits?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalTodos?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ApiKeyResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  expiresAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  keyHash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  keyPrefix?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastUsedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  revokedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  scopes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<ApiKeyUserArgs>>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type CreateApiKeyResultResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CreateApiKeyResult'] = ResolversParentTypes['CreateApiKeyResult']> = {
  apiKey?: Resolver<ResolversTypes['ApiKey'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type HabitResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Habit'] = ResolversParentTypes['Habit']> = {
  activityType?: Resolver<Maybe<ResolversTypes['ActivityType']>, ParentType, ContextType, Partial<HabitActivityTypeArgs>>;
  activityTypeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  completions?: Resolver<Array<ResolversTypes['HabitCompletion']>, ParentType, ContextType, Partial<HabitCompletionsArgs>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  estimatedLength?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  frequencyCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  frequencyUnit?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  minTimeBetweenInstances?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  pomodoroEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  pomodoroLongBreakLength?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  pomodoroShortBreakLength?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  pomodoroUnitLength?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  pomodoroUnitsBeforeLongBreak?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<HabitUserArgs>>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type HabitCompletionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HabitCompletion'] = ResolversParentTypes['HabitCompletion']> = {
  completedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  habit?: Resolver<Maybe<ResolversTypes['Habit']>, ParentType, ContextType, Partial<HabitCompletionHabitArgs>>;
  habitId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scheduledAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
};

export type HabitDetailResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HabitDetail'] = ResolversParentTypes['HabitDetail']> = {
  activityType?: Resolver<Maybe<ResolversTypes['ActivityType']>, ParentType, ContextType>;
  allTimeRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  estimatedLength?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  frequencyCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  frequencyUnit?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  habitId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  periods?: Resolver<Array<ResolversTypes['HabitPeriod']>, ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalCompletions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type HabitPeriodResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HabitPeriod'] = ResolversParentTypes['HabitPeriod']> = {
  completions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  periodEnd?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  periodStart?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  target?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type HabitStatSummaryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HabitStatSummary'] = ResolversParentTypes['HabitStatSummary']> = {
  activityType?: Resolver<Maybe<ResolversTypes['ActivityType']>, ParentType, ContextType>;
  completionRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  completions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  frequencyCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  frequencyUnit?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  habitId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  target?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type HabitStatsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HabitStats'] = ResolversParentTypes['HabitStats']> = {
  completionRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  habitId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalCompletions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createActivityType?: Resolver<Maybe<ResolversTypes['ActivityType']>, ParentType, ContextType, RequireFields<MutationCreateActivityTypeArgs, 'values'>>;
  createActivityTypes?: Resolver<Array<ResolversTypes['ActivityType']>, ParentType, ContextType, RequireFields<MutationCreateActivityTypesArgs, 'values'>>;
  createApiKey?: Resolver<Maybe<ResolversTypes['ApiKey']>, ParentType, ContextType, RequireFields<MutationCreateApiKeyArgs, 'values'>>;
  createApiKeys?: Resolver<Array<ResolversTypes['ApiKey']>, ParentType, ContextType, RequireFields<MutationCreateApiKeysArgs, 'values'>>;
  createHabit?: Resolver<Maybe<ResolversTypes['Habit']>, ParentType, ContextType, RequireFields<MutationCreateHabitArgs, 'values'>>;
  createHabitCompletion?: Resolver<Maybe<ResolversTypes['HabitCompletion']>, ParentType, ContextType, RequireFields<MutationCreateHabitCompletionArgs, 'values'>>;
  createHabitCompletions?: Resolver<Array<ResolversTypes['HabitCompletion']>, ParentType, ContextType, RequireFields<MutationCreateHabitCompletionsArgs, 'values'>>;
  createHabits?: Resolver<Array<ResolversTypes['Habit']>, ParentType, ContextType, RequireFields<MutationCreateHabitsArgs, 'values'>>;
  createTimeBlock?: Resolver<Maybe<ResolversTypes['TimeBlock']>, ParentType, ContextType, RequireFields<MutationCreateTimeBlockArgs, 'values'>>;
  createTimeBlocks?: Resolver<Array<ResolversTypes['TimeBlock']>, ParentType, ContextType, RequireFields<MutationCreateTimeBlocksArgs, 'values'>>;
  createTodo?: Resolver<Maybe<ResolversTypes['Todo']>, ParentType, ContextType, RequireFields<MutationCreateTodoArgs, 'values'>>;
  createTodoList?: Resolver<Maybe<ResolversTypes['TodoList']>, ParentType, ContextType, RequireFields<MutationCreateTodoListArgs, 'values'>>;
  createTodoLists?: Resolver<Array<ResolversTypes['TodoList']>, ParentType, ContextType, RequireFields<MutationCreateTodoListsArgs, 'values'>>;
  createTodos?: Resolver<Array<ResolversTypes['Todo']>, ParentType, ContextType, RequireFields<MutationCreateTodosArgs, 'values'>>;
  createUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'values'>>;
  createUsers?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationCreateUsersArgs, 'values'>>;
  deleteActivityTypes?: Resolver<Array<ResolversTypes['ActivityType']>, ParentType, ContextType, Partial<MutationDeleteActivityTypesArgs>>;
  deleteApiKeys?: Resolver<Array<ResolversTypes['ApiKey']>, ParentType, ContextType, Partial<MutationDeleteApiKeysArgs>>;
  deleteHabitCompletions?: Resolver<Array<ResolversTypes['HabitCompletion']>, ParentType, ContextType, Partial<MutationDeleteHabitCompletionsArgs>>;
  deleteHabits?: Resolver<Array<ResolversTypes['Habit']>, ParentType, ContextType, Partial<MutationDeleteHabitsArgs>>;
  deleteTimeBlocks?: Resolver<Array<ResolversTypes['TimeBlock']>, ParentType, ContextType, Partial<MutationDeleteTimeBlocksArgs>>;
  deleteTodoLists?: Resolver<Array<ResolversTypes['TodoList']>, ParentType, ContextType, Partial<MutationDeleteTodoListsArgs>>;
  deleteTodos?: Resolver<Array<ResolversTypes['Todo']>, ParentType, ContextType, Partial<MutationDeleteTodosArgs>>;
  deleteUsers?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, Partial<MutationDeleteUsersArgs>>;
  myCompleteHabit?: Resolver<ResolversTypes['HabitCompletion'], ParentType, ContextType, RequireFields<MutationMyCompleteHabitArgs, 'input'>>;
  myCompleteTodo?: Resolver<ResolversTypes['Todo'], ParentType, ContextType, RequireFields<MutationMyCompleteTodoArgs, 'id'>>;
  myCreateActivityType?: Resolver<ResolversTypes['ActivityType'], ParentType, ContextType, RequireFields<MutationMyCreateActivityTypeArgs, 'input'>>;
  myCreateApiKey?: Resolver<ResolversTypes['CreateApiKeyResult'], ParentType, ContextType, RequireFields<MutationMyCreateApiKeyArgs, 'input'>>;
  myCreateHabit?: Resolver<ResolversTypes['Habit'], ParentType, ContextType, RequireFields<MutationMyCreateHabitArgs, 'input'>>;
  myCreateTimeBlock?: Resolver<ResolversTypes['TimeBlock'], ParentType, ContextType, RequireFields<MutationMyCreateTimeBlockArgs, 'input'>>;
  myCreateTodo?: Resolver<ResolversTypes['Todo'], ParentType, ContextType, RequireFields<MutationMyCreateTodoArgs, 'input'>>;
  myCreateTodoList?: Resolver<ResolversTypes['TodoList'], ParentType, ContextType, RequireFields<MutationMyCreateTodoListArgs, 'input'>>;
  myDeleteActivityType?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMyDeleteActivityTypeArgs, 'id'>>;
  myDeleteHabit?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMyDeleteHabitArgs, 'id'>>;
  myDeleteTimeBlock?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMyDeleteTimeBlockArgs, 'id'>>;
  myDeleteTodo?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMyDeleteTodoArgs, 'id'>>;
  myDeleteTodoList?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMyDeleteTodoListArgs, 'id'>>;
  myReschedule?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, Partial<MutationMyRescheduleArgs>>;
  myRevokeApiKey?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMyRevokeApiKeyArgs, 'id'>>;
  myUncompleteHabit?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMyUncompleteHabitArgs, 'completionId'>>;
  myUpdateActivityType?: Resolver<ResolversTypes['ActivityType'], ParentType, ContextType, RequireFields<MutationMyUpdateActivityTypeArgs, 'input'>>;
  myUpdateHabit?: Resolver<ResolversTypes['Habit'], ParentType, ContextType, RequireFields<MutationMyUpdateHabitArgs, 'input'>>;
  myUpdateProfile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMyUpdateProfileArgs, 'timezone'>>;
  myUpdateTimeBlock?: Resolver<ResolversTypes['TimeBlock'], ParentType, ContextType, RequireFields<MutationMyUpdateTimeBlockArgs, 'input'>>;
  myUpdateTodo?: Resolver<ResolversTypes['Todo'], ParentType, ContextType, RequireFields<MutationMyUpdateTodoArgs, 'input'>>;
  myUpdateTodoList?: Resolver<ResolversTypes['TodoList'], ParentType, ContextType, RequireFields<MutationMyUpdateTodoListArgs, 'input'>>;
  requestMagicLink?: Resolver<ResolversTypes['RequestMagicLinkResult'], ParentType, ContextType, RequireFields<MutationRequestMagicLinkArgs, 'email'>>;
  updateActivityTypes?: Resolver<Array<ResolversTypes['ActivityType']>, ParentType, ContextType, RequireFields<MutationUpdateActivityTypesArgs, 'set'>>;
  updateApiKeys?: Resolver<Array<ResolversTypes['ApiKey']>, ParentType, ContextType, RequireFields<MutationUpdateApiKeysArgs, 'set'>>;
  updateHabitCompletions?: Resolver<Array<ResolversTypes['HabitCompletion']>, ParentType, ContextType, RequireFields<MutationUpdateHabitCompletionsArgs, 'set'>>;
  updateHabits?: Resolver<Array<ResolversTypes['Habit']>, ParentType, ContextType, RequireFields<MutationUpdateHabitsArgs, 'set'>>;
  updateTimeBlocks?: Resolver<Array<ResolversTypes['TimeBlock']>, ParentType, ContextType, RequireFields<MutationUpdateTimeBlocksArgs, 'set'>>;
  updateTodoLists?: Resolver<Array<ResolversTypes['TodoList']>, ParentType, ContextType, RequireFields<MutationUpdateTodoListsArgs, 'set'>>;
  updateTodos?: Resolver<Array<ResolversTypes['Todo']>, ParentType, ContextType, RequireFields<MutationUpdateTodosArgs, 'set'>>;
  updateUsers?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUpdateUsersArgs, 'set'>>;
  verifyMagicLink?: Resolver<ResolversTypes['VerifyMagicLinkResult'], ParentType, ContextType, RequireFields<MutationVerifyMagicLinkArgs, 'token'>>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  activityType?: Resolver<Maybe<ResolversTypes['ActivityType']>, ParentType, ContextType, Partial<QueryActivityTypeArgs>>;
  activityTypeStats?: Resolver<Array<ResolversTypes['ActivityTypeStats']>, ParentType, ContextType, Partial<QueryActivityTypeStatsArgs>>;
  activityTypes?: Resolver<Array<ResolversTypes['ActivityType']>, ParentType, ContextType, Partial<QueryActivityTypesArgs>>;
  apiKey?: Resolver<Maybe<ResolversTypes['ApiKey']>, ParentType, ContextType, Partial<QueryApiKeyArgs>>;
  apiKeys?: Resolver<Array<ResolversTypes['ApiKey']>, ParentType, ContextType, Partial<QueryApiKeysArgs>>;
  habit?: Resolver<Maybe<ResolversTypes['Habit']>, ParentType, ContextType, Partial<QueryHabitArgs>>;
  habitCompletion?: Resolver<Maybe<ResolversTypes['HabitCompletion']>, ParentType, ContextType, Partial<QueryHabitCompletionArgs>>;
  habitCompletions?: Resolver<Array<ResolversTypes['HabitCompletion']>, ParentType, ContextType, Partial<QueryHabitCompletionsArgs>>;
  habitStats?: Resolver<Array<ResolversTypes['HabitStats']>, ParentType, ContextType, Partial<QueryHabitStatsArgs>>;
  habits?: Resolver<Array<ResolversTypes['Habit']>, ParentType, ContextType, Partial<QueryHabitsArgs>>;
  myActivityTypes?: Resolver<Array<ResolversTypes['ActivityType']>, ParentType, ContextType>;
  myApiKeys?: Resolver<Array<ResolversTypes['ApiKey']>, ParentType, ContextType>;
  myHabitDetail?: Resolver<ResolversTypes['HabitDetail'], ParentType, ContextType, RequireFields<QueryMyHabitDetailArgs, 'habitId'>>;
  myHabits?: Resolver<Array<ResolversTypes['Habit']>, ParentType, ContextType, Partial<QueryMyHabitsArgs>>;
  myProfile?: Resolver<Maybe<ResolversTypes['UserProfile']>, ParentType, ContextType>;
  mySchedule?: Resolver<Array<ResolversTypes['ScheduledItem']>, ParentType, ContextType, Partial<QueryMyScheduleArgs>>;
  myStats?: Resolver<ResolversTypes['StatsOverview'], ParentType, ContextType, Partial<QueryMyStatsArgs>>;
  myTimeBlocks?: Resolver<Array<ResolversTypes['TimeBlock']>, ParentType, ContextType, Partial<QueryMyTimeBlocksArgs>>;
  myTodoLists?: Resolver<Array<ResolversTypes['TodoList']>, ParentType, ContextType>;
  myTodos?: Resolver<Array<ResolversTypes['Todo']>, ParentType, ContextType, Partial<QueryMyTodosArgs>>;
  timeBlock?: Resolver<Maybe<ResolversTypes['TimeBlock']>, ParentType, ContextType, Partial<QueryTimeBlockArgs>>;
  timeBlocks?: Resolver<Array<ResolversTypes['TimeBlock']>, ParentType, ContextType, Partial<QueryTimeBlocksArgs>>;
  todo?: Resolver<Maybe<ResolversTypes['Todo']>, ParentType, ContextType, Partial<QueryTodoArgs>>;
  todoList?: Resolver<Maybe<ResolversTypes['TodoList']>, ParentType, ContextType, Partial<QueryTodoListArgs>>;
  todoLists?: Resolver<Array<ResolversTypes['TodoList']>, ParentType, ContextType, Partial<QueryTodoListsArgs>>;
  todos?: Resolver<Array<ResolversTypes['Todo']>, ParentType, ContextType, Partial<QueryTodosArgs>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryUserArgs>>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryUsersArgs>>;
};

export type RequestMagicLinkResultResolvers<ContextType = Context, ParentType extends ResolversParentTypes['RequestMagicLinkResult'] = ResolversParentTypes['RequestMagicLinkResult']> = {
  magicLink?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type ScheduledItemResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ScheduledItem'] = ResolversParentTypes['ScheduledItem']> = {
  activityType?: Resolver<Maybe<ResolversTypes['ActivityType']>, ParentType, ContextType>;
  completedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  estimatedLength?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isOverdue?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isScheduled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['ScheduledItemKind'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scheduledEnd?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scheduledStart?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type StatsOverviewResolvers<ContextType = Context, ParentType extends ResolversParentTypes['StatsOverview'] = ResolversParentTypes['StatsOverview']> = {
  habitScore?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  habits?: Resolver<Array<ResolversTypes['HabitStatSummary']>, ParentType, ContextType>;
  todoScore?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  todos?: Resolver<ResolversTypes['TodoStatSummary'], ParentType, ContextType>;
  weightedScore?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  myTodoListsUpdated?: SubscriptionResolver<ResolversTypes['TodoListEvent'], "myTodoListsUpdated", ParentType, ContextType>;
  myTodosUpdated?: SubscriptionResolver<ResolversTypes['TodoEvent'], "myTodosUpdated", ParentType, ContextType>;
};

export type TimeBlockResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TimeBlock'] = ResolversParentTypes['TimeBlock']> = {
  activityType?: Resolver<Maybe<ResolversTypes['ActivityType']>, ParentType, ContextType, Partial<TimeBlockActivityTypeArgs>>;
  activityTypeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  daysOfWeek?: Resolver<Array<ResolversTypes['Int']>, ParentType, ContextType>;
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<TimeBlockUserArgs>>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TodoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Todo'] = ResolversParentTypes['Todo']> = {
  activityType?: Resolver<Maybe<ResolversTypes['ActivityType']>, ParentType, ContextType>;
  completedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dueAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  estimatedLength?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  list?: Resolver<Maybe<ResolversTypes['TodoList']>, ParentType, ContextType, Partial<TodoListArgs>>;
  listId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  manuallyScheduled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scheduledAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<TodoUserArgs>>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TodoEventResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TodoEvent'] = ResolversParentTypes['TodoEvent']> = {
  deletedId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  todo?: Resolver<Maybe<ResolversTypes['Todo']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['TodoEventType'], ParentType, ContextType>;
};

export type TodoListResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TodoList'] = ResolversParentTypes['TodoList']> = {
  activityType?: Resolver<Maybe<ResolversTypes['ActivityType']>, ParentType, ContextType, Partial<TodoListActivityTypeArgs>>;
  activityTypeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  defaultEstimatedLength?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  defaultPriority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  todos?: Resolver<Array<ResolversTypes['Todo']>, ParentType, ContextType, Partial<TodoListTodosArgs>>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<TodoListUserArgs>>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TodoListEventResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TodoListEvent'] = ResolversParentTypes['TodoListEvent']> = {
  deletedId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  todoList?: Resolver<Maybe<ResolversTypes['TodoList']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['TodoEventType'], ParentType, ContextType>;
};

export type TodoStatSummaryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TodoStatSummary'] = ResolversParentTypes['TodoStatSummary']> = {
  completed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  completionRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  overdue?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  activityTypes?: Resolver<Array<ResolversTypes['ActivityType']>, ParentType, ContextType, Partial<UserActivityTypesArgs>>;
  apiKeys?: Resolver<Array<ResolversTypes['ApiKey']>, ParentType, ContextType, Partial<UserApiKeysArgs>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  habits?: Resolver<Array<ResolversTypes['Habit']>, ParentType, ContextType, Partial<UserHabitsArgs>>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timeBlocks?: Resolver<Array<ResolversTypes['TimeBlock']>, ParentType, ContextType, Partial<UserTimeBlocksArgs>>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  todoLists?: Resolver<Array<ResolversTypes['TodoList']>, ParentType, ContextType, Partial<UserTodoListsArgs>>;
  todos?: Resolver<Array<ResolversTypes['Todo']>, ParentType, ContextType, Partial<UserTodosArgs>>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
};

export type UserProfileResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserProfile'] = ResolversParentTypes['UserProfile']> = {
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type VerifyMagicLinkResultResolvers<ContextType = Context, ParentType extends ResolversParentTypes['VerifyMagicLinkResult'] = ResolversParentTypes['VerifyMagicLinkResult']> = {
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  ActivityType?: ActivityTypeResolvers<ContextType>;
  ActivityTypeStats?: ActivityTypeStatsResolvers<ContextType>;
  ApiKey?: ApiKeyResolvers<ContextType>;
  CreateApiKeyResult?: CreateApiKeyResultResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Habit?: HabitResolvers<ContextType>;
  HabitCompletion?: HabitCompletionResolvers<ContextType>;
  HabitDetail?: HabitDetailResolvers<ContextType>;
  HabitPeriod?: HabitPeriodResolvers<ContextType>;
  HabitStatSummary?: HabitStatSummaryResolvers<ContextType>;
  HabitStats?: HabitStatsResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RequestMagicLinkResult?: RequestMagicLinkResultResolvers<ContextType>;
  ScheduledItem?: ScheduledItemResolvers<ContextType>;
  StatsOverview?: StatsOverviewResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  TimeBlock?: TimeBlockResolvers<ContextType>;
  Todo?: TodoResolvers<ContextType>;
  TodoEvent?: TodoEventResolvers<ContextType>;
  TodoList?: TodoListResolvers<ContextType>;
  TodoListEvent?: TodoListEventResolvers<ContextType>;
  TodoStatSummary?: TodoStatSummaryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserProfile?: UserProfileResolvers<ContextType>;
  VerifyMagicLinkResult?: VerifyMagicLinkResultResolvers<ContextType>;
};

