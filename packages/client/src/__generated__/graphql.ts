/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CompleteHabitArgs = {
  completedAt?: string | null | undefined;
  habitId: string | number;
  scheduledAt?: string | null | undefined;
};

export type CreateActivityTypeArgs = {
  color?: string | null | undefined;
  name: string;
};

export type CreateHabitArgs = {
  activityTypeId: string | number;
  description?: string | null | undefined;
  estimatedLength?: number | null | undefined;
  frequencyCount: number;
  frequencyUnit: string;
  minTimeBetweenInstances?: number | null | undefined;
  pomodoroEnabled?: boolean | null | undefined;
  pomodoroLongBreakLength?: number | null | undefined;
  pomodoroMaxPerDay?: number | null | undefined;
  pomodoroShortBreakLength?: number | null | undefined;
  pomodoroUnitLength?: number | null | undefined;
  pomodoroUnitsBeforeLongBreak?: number | null | undefined;
  priority?: number | null | undefined;
  title: string;
};

export type CreateTimeBlockArgs = {
  activityTypeId: string | number;
  daysOfWeek: Array<number>;
  endTime: string;
  priority?: number | null | undefined;
  startTime: string;
};

export type CreateTodoArgs = {
  description?: string | null | undefined;
  dueAt?: string | null | undefined;
  estimatedLength?: number | null | undefined;
  listId: string | number;
  priority?: number | null | undefined;
  scheduledAt?: string | null | undefined;
  title: string;
};

export type CreateTodoListArgs = {
  activityTypeId: string | number;
  defaultEstimatedLength?: number | null | undefined;
  defaultPriority?: number | null | undefined;
  description?: string | null | undefined;
  name: string;
};

export type MyCreateApiKeyInput = {
  expiresAt?: string | null | undefined;
  name: string;
  scopes: Array<string>;
};

export type ScheduledItemKind =
  | 'habit'
  | 'pomodoro'
  | 'todo';

export type TodoEventType =
  | 'created'
  | 'deleted'
  | 'updated';

export type UpdateActivityTypeArgs = {
  color?: string | null | undefined;
  id: string | number;
  name?: string | null | undefined;
};

export type UpdateHabitArgs = {
  activityTypeId?: string | number | null | undefined;
  description?: string | null | undefined;
  estimatedLength?: number | null | undefined;
  frequencyCount?: number | null | undefined;
  frequencyUnit?: string | null | undefined;
  id: string | number;
  minTimeBetweenInstances?: number | null | undefined;
  pomodoroEnabled?: boolean | null | undefined;
  pomodoroLongBreakLength?: number | null | undefined;
  pomodoroMaxPerDay?: number | null | undefined;
  pomodoroShortBreakLength?: number | null | undefined;
  pomodoroUnitLength?: number | null | undefined;
  pomodoroUnitsBeforeLongBreak?: number | null | undefined;
  priority?: number | null | undefined;
  title?: string | null | undefined;
};

export type UpdateTimeBlockArgs = {
  activityTypeId?: string | number | null | undefined;
  daysOfWeek?: Array<number> | null | undefined;
  endTime?: string | null | undefined;
  id: string | number;
  priority?: number | null | undefined;
  startTime?: string | null | undefined;
};

export type UpdateTodoArgs = {
  completedAt?: string | null | undefined;
  description?: string | null | undefined;
  dueAt?: string | null | undefined;
  estimatedLength?: number | null | undefined;
  id: string | number;
  listId?: string | number | null | undefined;
  manuallyScheduled?: boolean | null | undefined;
  priority?: number | null | undefined;
  scheduledAt?: string | null | undefined;
  title?: string | null | undefined;
};

export type UpdateTodoListArgs = {
  activityTypeId?: string | number | null | undefined;
  defaultEstimatedLength?: number | null | undefined;
  defaultPriority?: number | null | undefined;
  description?: string | null | undefined;
  id: string | number;
  name?: string | null | undefined;
};

export type GetMyActivityTypesNativeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyActivityTypesNativeQuery = { myActivityTypes: Array<{ id: string, name: string, color: string }> };

export type CreateActivityTypeNativeMutationVariables = Exact<{
  input: CreateActivityTypeArgs;
}>;


export type CreateActivityTypeNativeMutation = { myCreateActivityType: { id: string, name: string, color: string } };

export type UpdateActivityTypeNativeMutationVariables = Exact<{
  input: UpdateActivityTypeArgs;
}>;


export type UpdateActivityTypeNativeMutation = { myUpdateActivityType: { id: string, name: string, color: string } };

export type DeleteActivityTypeNativeMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteActivityTypeNativeMutation = { myDeleteActivityType: boolean };

export type GetMyActivityTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyActivityTypesQuery = { myActivityTypes: Array<{ id: string, name: string, color: string }> };

export type GetActivityTypeStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActivityTypeStatsQuery = { myActivityTypeStats: Array<{ activityTypeId: string, totalTodos: number, completedTodos: number, totalHabits: number }> };

export type GetCalendarDataQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCalendarDataQuery = { myTimeBlocks: Array<{ id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, activityType: { id: string, name: string, color: string } | null }> };

export type MyScheduleQueryVariables = Exact<{
  weekStart?: string | null | undefined;
  timezone?: string | null | undefined;
}>;


export type MyScheduleQuery = { mySchedule: Array<{ id: string, kind: ScheduledItemKind, title: string, isScheduled: boolean, isOverdue: boolean, scheduledStart: string | null, scheduledEnd: string | null, completedAt: string | null, priority: number, estimatedLength: number, activityType: { id: string, name: string, color: string } | null }> };

export type UpdateProfileMutationVariables = Exact<{
  timezone: string;
}>;


export type UpdateProfileMutation = { myUpdateProfile: boolean };

export type DashboardTodoUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DashboardTodoUpdatedSubscription = { myTodosUpdated: { type: TodoEventType, deletedId: string | null } };

export type GetMyHabitsNativeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyHabitsNativeQuery = { myHabits: Array<{ id: string, title: string, description: string | null, priority: number, estimatedLength: number, frequencyCount: number, frequencyUnit: string, minTimeBetweenInstances: number | null, pomodoroEnabled: boolean, pomodoroUnitLength: number | null, pomodoroShortBreakLength: number | null, pomodoroUnitsBeforeLongBreak: number | null, pomodoroLongBreakLength: number | null, pomodoroMaxPerDay: number | null, createdAt: unknown, activityType: { id: string, name: string, color: string } | null }> };

export type CreateHabitNativeMutationVariables = Exact<{
  input: CreateHabitArgs;
}>;


export type CreateHabitNativeMutation = { myCreateHabit: { id: string, title: string, description: string | null, priority: number, estimatedLength: number, frequencyCount: number, frequencyUnit: string, minTimeBetweenInstances: number | null, pomodoroEnabled: boolean, pomodoroUnitLength: number | null, pomodoroShortBreakLength: number | null, pomodoroUnitsBeforeLongBreak: number | null, pomodoroLongBreakLength: number | null, pomodoroMaxPerDay: number | null, createdAt: unknown, activityType: { id: string, name: string, color: string } | null } };

export type UpdateHabitNativeMutationVariables = Exact<{
  input: UpdateHabitArgs;
}>;


export type UpdateHabitNativeMutation = { myUpdateHabit: { id: string, title: string, description: string | null, priority: number, estimatedLength: number, frequencyCount: number, frequencyUnit: string, minTimeBetweenInstances: number | null, pomodoroEnabled: boolean, pomodoroUnitLength: number | null, pomodoroShortBreakLength: number | null, pomodoroUnitsBeforeLongBreak: number | null, pomodoroLongBreakLength: number | null, pomodoroMaxPerDay: number | null, createdAt: unknown, activityType: { id: string, name: string, color: string } | null } };

export type DeleteHabitNativeMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteHabitNativeMutation = { myDeleteHabit: boolean };

export type GetActivityTypesForHabitsNativeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActivityTypesForHabitsNativeQuery = { myActivityTypes: Array<{ id: string, name: string, color: string }> };

export type GetMyHabitsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyHabitsQuery = { myHabits: Array<{ id: string, title: string, description: string | null, priority: number, estimatedLength: number, frequencyCount: number, frequencyUnit: string, minTimeBetweenInstances: number | null, pomodoroEnabled: boolean, pomodoroUnitLength: number | null, pomodoroShortBreakLength: number | null, pomodoroUnitsBeforeLongBreak: number | null, pomodoroLongBreakLength: number | null, pomodoroMaxPerDay: number | null, createdAt: unknown, activityType: { id: string, name: string, color: string } | null }> };

export type CheckOnboardedQueryVariables = Exact<{ [key: string]: never; }>;


export type CheckOnboardedQuery = { myActivityTypes: Array<{ id: string }> };

export type GetMyStatsQueryVariables = Exact<{
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
}>;


export type GetMyStatsQuery = { myStats: { weightedScore: number | null, habitScore: number | null, todoScore: number | null, habits: Array<{ habitId: string, title: string, completionRate: number, completions: number, target: number, frequencyUnit: string, frequencyCount: number, activityType: { id: string, color: string } | null }>, todos: { total: number, completed: number, overdue: number, completionRate: number } } };

export type GetActivityTypeStatsWithRangeQueryVariables = Exact<{
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
}>;


export type GetActivityTypeStatsWithRangeQuery = { myActivityTypeStats: Array<{ activityTypeId: string, activityTypeName: string, totalTodos: number, completedTodos: number, totalHabits: number }>, myActivityTypes: Array<{ id: string, name: string, color: string }> };

export type GetMyTimeBlocksNativeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyTimeBlocksNativeQuery = { myTimeBlocks: Array<{ id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, priority: number, createdAt: unknown, activityType: { id: string, name: string, color: string } | null }> };

export type GetActivityTypesForTimeBlocksNativeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActivityTypesForTimeBlocksNativeQuery = { myActivityTypes: Array<{ id: string, name: string, color: string }> };

export type CreateTimeBlockNativeMutationVariables = Exact<{
  input: CreateTimeBlockArgs;
}>;


export type CreateTimeBlockNativeMutation = { myCreateTimeBlock: { id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, priority: number, createdAt: unknown, activityType: { id: string, name: string, color: string } | null } };

export type DeleteTimeBlockNativeMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTimeBlockNativeMutation = { myDeleteTimeBlock: boolean };

export type GetMyTimeBlocksNativeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyTimeBlocksNativeQuery = { myTimeBlocks: Array<{ id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, priority: number, createdAt: unknown, activityType: { id: string, name: string, color: string } | null }> };

export type GetActivityTypesForTimeBlocksNativeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActivityTypesForTimeBlocksNativeQuery = { myActivityTypes: Array<{ id: string, name: string, color: string }> };

export type CreateTimeBlockNativeMutationVariables = Exact<{
  input: CreateTimeBlockArgs;
}>;


export type CreateTimeBlockNativeMutation = { myCreateTimeBlock: { id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, priority: number, createdAt: unknown, activityType: { id: string, name: string, color: string } | null } };

export type DeleteTimeBlockNativeMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTimeBlockNativeMutation = { myDeleteTimeBlock: boolean };

export type GetMyTimeBlocksQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyTimeBlocksQuery = { myTimeBlocks: Array<{ id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, priority: number, createdAt: unknown, activityType: { id: string, name: string, color: string } | null }> };

export type GetTodoListsPageNativeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTodoListsPageNativeQuery = { myTodoLists: Array<{ id: string, name: string, description: string | null, defaultPriority: number, defaultEstimatedLength: number, activityType: { id: string, name: string, color: string } | null }>, myTodos: Array<{ id: string, title: string, description: string | null, priority: number, estimatedLength: number, dueAt: unknown, scheduledAt: unknown, completedAt: unknown, createdAt: unknown, list: { id: string, name: string } | null, activityType: { id: string, name: string, color: string } | null }> };

export type CreateTodoListNativeMutationVariables = Exact<{
  input: CreateTodoListArgs;
}>;


export type CreateTodoListNativeMutation = { myCreateTodoList: { id: string, name: string, description: string | null, defaultPriority: number, defaultEstimatedLength: number, activityType: { id: string, name: string, color: string } | null } };

export type CreateTodoNativeMutationVariables = Exact<{
  input: CreateTodoArgs;
}>;


export type CreateTodoNativeMutation = { myCreateTodo: { id: string, title: string, description: string | null, priority: number, estimatedLength: number, dueAt: unknown, scheduledAt: unknown, completedAt: unknown, createdAt: unknown, list: { id: string, name: string } | null, activityType: { id: string, name: string, color: string } | null } };

export type CompleteTodoNativeMutationVariables = Exact<{
  id: string | number;
}>;


export type CompleteTodoNativeMutation = { myCompleteTodo: { id: string, completedAt: unknown } };

export type DeleteTodoNativeMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTodoNativeMutation = { myDeleteTodo: boolean };

export type GetTodoListsPageQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTodoListsPageQuery = { myTodoLists: Array<{ id: string, name: string, description: string | null, defaultPriority: number, defaultEstimatedLength: number, activityType: { id: string, name: string, color: string } | null }>, myTodos: Array<{ id: string, title: string, description: string | null, priority: number, estimatedLength: number, dueAt: unknown, scheduledAt: unknown, completedAt: unknown, createdAt: unknown, list: { id: string, name: string } | null, activityType: { id: string, name: string, color: string } | null }> };

export type TodoUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type TodoUpdatedSubscription = { myTodosUpdated: { type: TodoEventType, deletedId: string | null, todo: { id: string, title: string, description: string | null, priority: number, estimatedLength: number, dueAt: unknown, scheduledAt: unknown, completedAt: unknown, createdAt: unknown, list: { id: string, name: string } | null, activityType: { id: string, name: string, color: string } | null } | null } };

export type TodoListUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type TodoListUpdatedSubscription = { myTodoListsUpdated: { type: TodoEventType, deletedId: string | null, todoList: { id: string, name: string, description: string | null, defaultPriority: number, defaultEstimatedLength: number, activityType: { id: string, name: string, color: string } | null } | null } };

export type RequestMagicLinkMutationVariables = Exact<{
  email: string;
}>;


export type RequestMagicLinkMutation = { requestMagicLink: { ok: boolean, magicLink: string | null } };

export type VerifyMagicLinkMutationVariables = Exact<{
  token: string;
}>;


export type VerifyMagicLinkMutation = { verifyMagicLink: { token: string, userId: string } };

export type CompleteTodoFromDialogMutationVariables = Exact<{
  id: string | number;
  completedAt?: string | null | undefined;
}>;


export type CompleteTodoFromDialogMutation = { myCompleteTodo: { id: string, completedAt: unknown, scheduledAt: unknown } };

export type CompleteHabitFromDialogMutationVariables = Exact<{
  input: CompleteHabitArgs;
}>;


export type CompleteHabitFromDialogMutation = { myCompleteHabit: { id: string, completedAt: unknown, scheduledAt: unknown } };

export type CreateActivityTypeMutationVariables = Exact<{
  input: CreateActivityTypeArgs;
}>;


export type CreateActivityTypeMutation = { myCreateActivityType: { id: string, name: string, color: string } };

export type UpdateActivityTypeMutationVariables = Exact<{
  input: UpdateActivityTypeArgs;
}>;


export type UpdateActivityTypeMutation = { myUpdateActivityType: { id: string, name: string, color: string } };

export type DeleteActivityTypeMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteActivityTypeMutation = { myDeleteActivityType: boolean };

export type ActivityType_ActivityTypeListFragment = { id: string, name: string, color: string };

export type GetActivityTypesForSelectQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActivityTypesForSelectQuery = { myActivityTypes: Array<{ id: string, name: string, color: string }> };

export type TimeBlock_CalendarViewFragment = { id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, activityType: { id: string, name: string, color: string } | null };

export type ScheduledItem_CalendarViewFragment = { kind: ScheduledItemKind, id: string, title: string, isScheduled: boolean, isOverdue: boolean, scheduledStart: string | null, scheduledEnd: string | null, completedAt: string | null, activityType: { id: string, name: string, color: string } | null };

export type PinTodoMutationVariables = Exact<{
  input: UpdateTodoArgs;
}>;


export type PinTodoMutation = { myUpdateTodo: { id: string, scheduledAt: unknown, manuallyScheduled: boolean } };

export type CompleteHabitFromCalendarMutationVariables = Exact<{
  input: CompleteHabitArgs;
}>;


export type CompleteHabitFromCalendarMutation = { myCompleteHabit: { __typename: 'HabitCompletion', id: string, completedAt: unknown } };

export type CompleteTodoFromCalendarMutationVariables = Exact<{
  id: string | number;
}>;


export type CompleteTodoFromCalendarMutation = { myCompleteTodo: { __typename: 'Todo', id: string, completedAt: unknown } };

export type ScheduledItem_ScheduleViewFragment = { kind: ScheduledItemKind, id: string, title: string, priority: number, estimatedLength: number, isScheduled: boolean, scheduledStart: string | null, scheduledEnd: string | null, activityType: { id: string, name: string, color: string } | null };

export type CompleteHabitFromScheduleMutationVariables = Exact<{
  input: CompleteHabitArgs;
}>;


export type CompleteHabitFromScheduleMutation = { myCompleteHabit: { __typename: 'HabitCompletion', id: string, completedAt: unknown } };

export type CompleteTodoFromScheduleMutationVariables = Exact<{
  id: string | number;
}>;


export type CompleteTodoFromScheduleMutation = { myCompleteTodo: { __typename: 'Todo', id: string, completedAt: unknown } };

export type GetHabitDetailQueryVariables = Exact<{
  habitId: string | number;
  periods?: number | null | undefined;
}>;


export type GetHabitDetailQuery = { myHabitDetail: { habitId: string, title: string, description: string | null, priority: number, estimatedLength: number, frequencyCount: number, frequencyUnit: string, totalCompletions: number, allTimeRate: number, activityType: { id: string, name: string, color: string } | null, periods: Array<{ label: string, periodStart: string, periodEnd: string, completions: number, target: number, rate: number }> } };

export type CreateHabitMutationVariables = Exact<{
  input: CreateHabitArgs;
}>;


export type CreateHabitMutation = { myCreateHabit: { id: string, title: string, description: string | null, priority: number, estimatedLength: number, frequencyCount: number, frequencyUnit: string, pomodoroEnabled: boolean, pomodoroUnitLength: number | null, pomodoroShortBreakLength: number | null, pomodoroUnitsBeforeLongBreak: number | null, pomodoroLongBreakLength: number | null, pomodoroMaxPerDay: number | null, activityType: { id: string, name: string, color: string } | null } };

export type UpdateHabitMutationVariables = Exact<{
  input: UpdateHabitArgs;
}>;


export type UpdateHabitMutation = { myUpdateHabit: { id: string, title: string, description: string | null, priority: number, estimatedLength: number, frequencyCount: number, frequencyUnit: string, pomodoroEnabled: boolean, pomodoroUnitLength: number | null, pomodoroShortBreakLength: number | null, pomodoroUnitsBeforeLongBreak: number | null, pomodoroLongBreakLength: number | null, pomodoroMaxPerDay: number | null, activityType: { id: string, name: string, color: string } | null } };

export type UpdateHabitEstimatedLengthMutationVariables = Exact<{
  input: UpdateHabitArgs;
}>;


export type UpdateHabitEstimatedLengthMutation = { myUpdateHabit: { id: string, estimatedLength: number } };

export type Habit_HabitListFragment = { id: string, title: string, description: string | null, priority: number, estimatedLength: number, frequencyCount: number, frequencyUnit: string, minTimeBetweenInstances: number | null, pomodoroEnabled: boolean, pomodoroUnitLength: number | null, pomodoroShortBreakLength: number | null, pomodoroUnitsBeforeLongBreak: number | null, pomodoroLongBreakLength: number | null, pomodoroMaxPerDay: number | null, createdAt: unknown, activityType: { id: string, name: string, color: string } | null };

export type GetActivityTypesForOnboardingQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActivityTypesForOnboardingQuery = { myActivityTypes: Array<{ id: string, name: string, color: string }> };

export type CreateActivityTypeOnboardingMutationVariables = Exact<{
  input: CreateActivityTypeArgs;
}>;


export type CreateActivityTypeOnboardingMutation = { myCreateActivityType: { id: string, name: string, color: string } };

export type GetMyHabitsForOnboardingQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyHabitsForOnboardingQuery = { myHabits: Array<{ id: string, title: string, frequencyCount: number, frequencyUnit: string, activityType: { id: string, name: string, color: string } | null }> };

export type CreateHabitOnboardingMutationVariables = Exact<{
  input: CreateHabitArgs;
}>;


export type CreateHabitOnboardingMutation = { myCreateHabit: { id: string, title: string } };

export type GetMyTimeblocksForOnboardingQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyTimeblocksForOnboardingQuery = { myTimeBlocks: Array<{ id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, activityType: { id: string, name: string, color: string } | null }> };

export type CreateTimeBlockOnboardingMutationVariables = Exact<{
  input: CreateTimeBlockArgs;
}>;


export type CreateTimeBlockOnboardingMutation = { myCreateTimeBlock: { id: string, daysOfWeek: Array<number>, startTime: string, endTime: string } };

export type GetMyTodosForOnboardingQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyTodosForOnboardingQuery = { myTodos: Array<{ id: string, title: string, priority: number, list: { id: string, name: string } | null, activityType: { id: string, name: string, color: string } | null }> };

export type CreateTodoOnboardingMutationVariables = Exact<{
  input: CreateTodoArgs;
}>;


export type CreateTodoOnboardingMutation = { myCreateTodo: { id: string, title: string } };

export type MyApiKeysQueryVariables = Exact<{ [key: string]: never; }>;


export type MyApiKeysQuery = { myApiKeys: Array<{ id: string, name: string, keyPrefix: string, scopes: Array<string>, lastUsedAt: unknown, expiresAt: unknown, createdAt: unknown }> };

export type MyRevokeApiKeyMutationVariables = Exact<{
  id: string | number;
}>;


export type MyRevokeApiKeyMutation = { myRevokeApiKey: boolean };

export type MyCreateApiKeyMutationVariables = Exact<{
  input: MyCreateApiKeyInput;
}>;


export type MyCreateApiKeyMutation = { myCreateApiKey: { token: string, apiKey: { id: string, name: string, keyPrefix: string, scopes: Array<string>, createdAt: unknown } } };

export type CreateTimeBlockMutationVariables = Exact<{
  input: CreateTimeBlockArgs;
}>;


export type CreateTimeBlockMutation = { myCreateTimeBlock: { id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, activityType: { id: string, name: string, color: string } | null } };

export type UpdateTimeBlockMutationVariables = Exact<{
  input: UpdateTimeBlockArgs;
}>;


export type UpdateTimeBlockMutation = { myUpdateTimeBlock: { id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, activityType: { id: string, name: string, color: string } | null } };

export type DeleteTimeBlockMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTimeBlockMutation = { myDeleteTimeBlock: boolean };

export type TimeBlock_TimeBlockListFragment = { id: string, daysOfWeek: Array<number>, startTime: string, endTime: string, priority: number, createdAt: unknown, activityType: { id: string, name: string, color: string } | null };

export type QuickCreateTodoMutationVariables = Exact<{
  input: CreateTodoArgs;
}>;


export type QuickCreateTodoMutation = { myCreateTodo: { id: string, title: string } };

export type CreateTodoListMutationVariables = Exact<{
  input: CreateTodoListArgs;
}>;


export type CreateTodoListMutation = { myCreateTodoList: { id: string, name: string, description: string | null, defaultPriority: number, defaultEstimatedLength: number, activityType: { id: string, name: string, color: string } | null } };

export type UpdateTodoListMutationVariables = Exact<{
  input: UpdateTodoListArgs;
}>;


export type UpdateTodoListMutation = { myUpdateTodoList: { id: string, name: string, description: string | null, defaultPriority: number, defaultEstimatedLength: number, activityType: { id: string, name: string, color: string } | null } };

export type DeleteTodoListMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTodoListMutation = { myDeleteTodoList: boolean };

export type TodoList_TodoListListFragment = { id: string, name: string, description: string | null, defaultPriority: number, defaultEstimatedLength: number, activityType: { id: string, name: string, color: string } | null };

export type GetTodoListsForSelectQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTodoListsForSelectQuery = { myTodoLists: Array<{ id: string, name: string, defaultPriority: number, defaultEstimatedLength: number, activityType: { id: string, name: string, color: string } | null }> };

export type CreateTodoMutationVariables = Exact<{
  input: CreateTodoArgs;
}>;


export type CreateTodoMutation = { myCreateTodo: { id: string, title: string, description: string | null, priority: number, estimatedLength: number, dueAt: unknown, scheduledAt: unknown, completedAt: unknown, list: { id: string, name: string } | null, activityType: { id: string, name: string, color: string } | null } };

export type UpdateTodoMutationVariables = Exact<{
  input: UpdateTodoArgs;
}>;


export type UpdateTodoMutation = { myUpdateTodo: { id: string, title: string, description: string | null, priority: number, estimatedLength: number, dueAt: unknown, scheduledAt: unknown, completedAt: unknown, list: { id: string, name: string } | null, activityType: { id: string, name: string, color: string } | null } };

export type CompleteTodoFromFormMutationVariables = Exact<{
  id: string | number;
}>;


export type CompleteTodoFromFormMutation = { myCompleteTodo: { id: string, completedAt: unknown } };

export type Todo_TodoListFragment = { id: string, title: string, description: string | null, priority: number, estimatedLength: number, dueAt: unknown, scheduledAt: unknown, completedAt: unknown, createdAt: unknown, list: { id: string, name: string } | null, activityType: { id: string, name: string, color: string } | null };

export type UpdateTodoEstimatedLengthMutationVariables = Exact<{
  input: UpdateTodoArgs;
}>;


export type UpdateTodoEstimatedLengthMutation = { myUpdateTodo: { id: string, estimatedLength: number } };

export type UncompleteTodoMutationVariables = Exact<{
  id: string | number;
}>;


export type UncompleteTodoMutation = { myUpdateTodo: { id: string, completedAt: unknown } };

export type DeleteTodoMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTodoMutation = { myDeleteTodo: boolean };

export type TodoListsUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type TodoListsUpdatedSubscription = { myTodoListsUpdated: { type: TodoEventType, deletedId: string | null, todoList: { id: string, name: string, description: string | null, defaultPriority: number, defaultEstimatedLength: number, activityType: { id: string, name: string, color: string } | null } | null } };

export type TodosUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type TodosUpdatedSubscription = { myTodosUpdated: { type: TodoEventType, deletedId: string | null, todo: { id: string, title: string, description: string | null, priority: number, estimatedLength: number, dueAt: unknown, scheduledAt: unknown, completedAt: unknown, createdAt: unknown, list: { id: string, name: string } | null, activityType: { id: string, name: string, color: string } | null } | null } };

export const ActivityType_ActivityTypeListFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityType_ActivityTypeList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]} as unknown as DocumentNode<ActivityType_ActivityTypeListFragment, unknown>;
export const TimeBlock_CalendarViewFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimeBlock_CalendarView"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimeBlock"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<TimeBlock_CalendarViewFragment, unknown>;
export const ScheduledItem_CalendarViewFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScheduledItem_CalendarView"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduledItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isOverdue"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStart"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEnd"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<ScheduledItem_CalendarViewFragment, unknown>;
export const ScheduledItem_ScheduleViewFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScheduledItem_ScheduleView"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduledItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStart"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEnd"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<ScheduledItem_ScheduleViewFragment, unknown>;
export const Habit_HabitListFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Habit_HabitList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Habit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"frequencyCount"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyUnit"}},{"kind":"Field","name":{"kind":"Name","value":"minTimeBetweenInstances"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroShortBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitsBeforeLongBreak"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroLongBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroMaxPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<Habit_HabitListFragment, unknown>;
export const TimeBlock_TimeBlockListFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimeBlock_TimeBlockList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimeBlock"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<TimeBlock_TimeBlockListFragment, unknown>;
export const TodoList_TodoListListFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoList_TodoListList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPriority"}},{"kind":"Field","name":{"kind":"Name","value":"defaultEstimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<TodoList_TodoListListFragment, unknown>;
export const Todo_TodoListFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Todo_TodoList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Todo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<Todo_TodoListFragment, unknown>;
export const GetMyActivityTypesNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyActivityTypesNative"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myActivityTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityType_ActivityTypeList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityType_ActivityTypeList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]} as unknown as DocumentNode<GetMyActivityTypesNativeQuery, GetMyActivityTypesNativeQueryVariables>;
export const CreateActivityTypeNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateActivityTypeNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateActivityTypeArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateActivityType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityType_ActivityTypeList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityType_ActivityTypeList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]} as unknown as DocumentNode<CreateActivityTypeNativeMutation, CreateActivityTypeNativeMutationVariables>;
export const UpdateActivityTypeNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateActivityTypeNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateActivityTypeArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateActivityType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityType_ActivityTypeList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityType_ActivityTypeList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]} as unknown as DocumentNode<UpdateActivityTypeNativeMutation, UpdateActivityTypeNativeMutationVariables>;
export const DeleteActivityTypeNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteActivityTypeNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDeleteActivityType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteActivityTypeNativeMutation, DeleteActivityTypeNativeMutationVariables>;
export const GetMyActivityTypesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyActivityTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myActivityTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityType_ActivityTypeList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityType_ActivityTypeList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]} as unknown as DocumentNode<GetMyActivityTypesQuery, GetMyActivityTypesQueryVariables>;
export const GetActivityTypeStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivityTypeStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myActivityTypeStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"totalTodos"}},{"kind":"Field","name":{"kind":"Name","value":"completedTodos"}},{"kind":"Field","name":{"kind":"Name","value":"totalHabits"}}]}}]}}]} as unknown as DocumentNode<GetActivityTypeStatsQuery, GetActivityTypeStatsQueryVariables>;
export const GetCalendarDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCalendarData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTimeBlocks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimeBlock_CalendarView"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimeBlock_CalendarView"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimeBlock"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<GetCalendarDataQuery, GetCalendarDataQueryVariables>;
export const MyScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MySchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timezone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mySchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"weekStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}}},{"kind":"Argument","name":{"kind":"Name","value":"timezone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timezone"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScheduledItem_CalendarView"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScheduledItem_ScheduleView"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScheduledItem_CalendarView"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduledItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isOverdue"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStart"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEnd"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScheduledItem_ScheduleView"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduledItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStart"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEnd"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<MyScheduleQuery, MyScheduleQueryVariables>;
export const UpdateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timezone"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"timezone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timezone"}}}]}]}}]} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const DashboardTodoUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DashboardTodoUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTodosUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"deletedId"}}]}}]}}]} as unknown as DocumentNode<DashboardTodoUpdatedSubscription, DashboardTodoUpdatedSubscriptionVariables>;
export const GetMyHabitsNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyHabitsNative"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myHabits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Habit_HabitList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Habit_HabitList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Habit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"frequencyCount"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyUnit"}},{"kind":"Field","name":{"kind":"Name","value":"minTimeBetweenInstances"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroShortBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitsBeforeLongBreak"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroLongBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroMaxPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetMyHabitsNativeQuery, GetMyHabitsNativeQueryVariables>;
export const CreateHabitNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateHabitNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateHabitArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateHabit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Habit_HabitList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Habit_HabitList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Habit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"frequencyCount"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyUnit"}},{"kind":"Field","name":{"kind":"Name","value":"minTimeBetweenInstances"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroShortBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitsBeforeLongBreak"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroLongBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroMaxPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<CreateHabitNativeMutation, CreateHabitNativeMutationVariables>;
export const UpdateHabitNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateHabitNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateHabitArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateHabit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Habit_HabitList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Habit_HabitList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Habit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"frequencyCount"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyUnit"}},{"kind":"Field","name":{"kind":"Name","value":"minTimeBetweenInstances"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroShortBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitsBeforeLongBreak"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroLongBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroMaxPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<UpdateHabitNativeMutation, UpdateHabitNativeMutationVariables>;
export const DeleteHabitNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteHabitNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDeleteHabit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteHabitNativeMutation, DeleteHabitNativeMutationVariables>;
export const GetActivityTypesForHabitsNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivityTypesForHabitsNative"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myActivityTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<GetActivityTypesForHabitsNativeQuery, GetActivityTypesForHabitsNativeQueryVariables>;
export const GetMyHabitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyHabits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myHabits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Habit_HabitList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Habit_HabitList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Habit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"frequencyCount"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyUnit"}},{"kind":"Field","name":{"kind":"Name","value":"minTimeBetweenInstances"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroShortBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitsBeforeLongBreak"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroLongBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroMaxPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetMyHabitsQuery, GetMyHabitsQueryVariables>;
export const CheckOnboardedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CheckOnboarded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myActivityTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CheckOnboardedQuery, CheckOnboardedQueryVariables>;
export const GetMyStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weightedScore"}},{"kind":"Field","name":{"kind":"Name","value":"habitScore"}},{"kind":"Field","name":{"kind":"Name","value":"todoScore"}},{"kind":"Field","name":{"kind":"Name","value":"habits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"habitId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"completionRate"}},{"kind":"Field","name":{"kind":"Name","value":"completions"}},{"kind":"Field","name":{"kind":"Name","value":"target"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyUnit"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyCount"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"todos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"completed"}},{"kind":"Field","name":{"kind":"Name","value":"overdue"}},{"kind":"Field","name":{"kind":"Name","value":"completionRate"}}]}}]}}]}}]} as unknown as DocumentNode<GetMyStatsQuery, GetMyStatsQueryVariables>;
export const GetActivityTypeStatsWithRangeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivityTypeStatsWithRange"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityTypeStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"activityTypeName"}},{"kind":"Field","name":{"kind":"Name","value":"totalTodos"}},{"kind":"Field","name":{"kind":"Name","value":"completedTodos"}},{"kind":"Field","name":{"kind":"Name","value":"totalHabits"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myActivityTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<GetActivityTypeStatsWithRangeQuery, GetActivityTypeStatsWithRangeQueryVariables>;
export const GetMyTimeBlocksNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyTimeBlocksNative"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTimeBlocks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimeBlock_TimeBlockList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimeBlock_TimeBlockList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimeBlock"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetMyTimeBlocksNativeQuery, GetMyTimeBlocksNativeQueryVariables>;
export const GetActivityTypesForTimeBlocksNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivityTypesForTimeBlocksNative"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myActivityTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<GetActivityTypesForTimeBlocksNativeQuery, GetActivityTypesForTimeBlocksNativeQueryVariables>;
export const CreateTimeBlockNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTimeBlockNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTimeBlockArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateTimeBlock"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimeBlock_TimeBlockList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimeBlock_TimeBlockList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimeBlock"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<CreateTimeBlockNativeMutation, CreateTimeBlockNativeMutationVariables>;
export const DeleteTimeBlockNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTimeBlockNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDeleteTimeBlock"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTimeBlockNativeMutation, DeleteTimeBlockNativeMutationVariables>;
export const GetMyTimeBlocksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyTimeBlocks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTimeBlocks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimeBlock_TimeBlockList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimeBlock_TimeBlockList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimeBlock"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetMyTimeBlocksQuery, GetMyTimeBlocksQueryVariables>;
export const GetTodoListsPageNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTodoListsPageNative"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTodoLists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TodoList_TodoListList"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myTodos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Todo_TodoList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoList_TodoListList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPriority"}},{"kind":"Field","name":{"kind":"Name","value":"defaultEstimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Todo_TodoList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Todo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetTodoListsPageNativeQuery, GetTodoListsPageNativeQueryVariables>;
export const CreateTodoListNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTodoListNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTodoListArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateTodoList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TodoList_TodoListList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoList_TodoListList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPriority"}},{"kind":"Field","name":{"kind":"Name","value":"defaultEstimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<CreateTodoListNativeMutation, CreateTodoListNativeMutationVariables>;
export const CreateTodoNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTodoNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTodoArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Todo_TodoList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Todo_TodoList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Todo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<CreateTodoNativeMutation, CreateTodoNativeMutationVariables>;
export const CompleteTodoNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteTodoNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCompleteTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<CompleteTodoNativeMutation, CompleteTodoNativeMutationVariables>;
export const DeleteTodoNativeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTodoNative"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDeleteTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTodoNativeMutation, DeleteTodoNativeMutationVariables>;
export const GetTodoListsPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTodoListsPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTodoLists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TodoList_TodoListList"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myTodos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Todo_TodoList"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoList_TodoListList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPriority"}},{"kind":"Field","name":{"kind":"Name","value":"defaultEstimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Todo_TodoList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Todo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetTodoListsPageQuery, GetTodoListsPageQueryVariables>;
export const TodoUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"TodoUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTodosUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"deletedId"}},{"kind":"Field","name":{"kind":"Name","value":"todo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Todo_TodoList"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Todo_TodoList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Todo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<TodoUpdatedSubscription, TodoUpdatedSubscriptionVariables>;
export const TodoListUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"TodoListUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTodoListsUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"deletedId"}},{"kind":"Field","name":{"kind":"Name","value":"todoList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TodoList_TodoListList"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoList_TodoListList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPriority"}},{"kind":"Field","name":{"kind":"Name","value":"defaultEstimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<TodoListUpdatedSubscription, TodoListUpdatedSubscriptionVariables>;
export const RequestMagicLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestMagicLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestMagicLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}},{"kind":"Field","name":{"kind":"Name","value":"magicLink"}}]}}]}}]} as unknown as DocumentNode<RequestMagicLinkMutation, RequestMagicLinkMutationVariables>;
export const VerifyMagicLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyMagicLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyMagicLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}}]}}]} as unknown as DocumentNode<VerifyMagicLinkMutation, VerifyMagicLinkMutationVariables>;
export const CompleteTodoFromDialogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteTodoFromDialog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"completedAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCompleteTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"completedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"completedAt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}}]}}]}}]} as unknown as DocumentNode<CompleteTodoFromDialogMutation, CompleteTodoFromDialogMutationVariables>;
export const CompleteHabitFromDialogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteHabitFromDialog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CompleteHabitArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCompleteHabit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}}]}}]}}]} as unknown as DocumentNode<CompleteHabitFromDialogMutation, CompleteHabitFromDialogMutationVariables>;
export const CreateActivityTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateActivityType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateActivityTypeArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateActivityType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<CreateActivityTypeMutation, CreateActivityTypeMutationVariables>;
export const UpdateActivityTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateActivityType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateActivityTypeArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateActivityType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<UpdateActivityTypeMutation, UpdateActivityTypeMutationVariables>;
export const DeleteActivityTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteActivityType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDeleteActivityType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteActivityTypeMutation, DeleteActivityTypeMutationVariables>;
export const GetActivityTypesForSelectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivityTypesForSelect"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myActivityTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<GetActivityTypesForSelectQuery, GetActivityTypesForSelectQueryVariables>;
export const PinTodoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PinTodo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTodoArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"manuallyScheduled"}}]}}]}}]} as unknown as DocumentNode<PinTodoMutation, PinTodoMutationVariables>;
export const CompleteHabitFromCalendarDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteHabitFromCalendar"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CompleteHabitArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCompleteHabit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<CompleteHabitFromCalendarMutation, CompleteHabitFromCalendarMutationVariables>;
export const CompleteTodoFromCalendarDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteTodoFromCalendar"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCompleteTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<CompleteTodoFromCalendarMutation, CompleteTodoFromCalendarMutationVariables>;
export const CompleteHabitFromScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteHabitFromSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CompleteHabitArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCompleteHabit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<CompleteHabitFromScheduleMutation, CompleteHabitFromScheduleMutationVariables>;
export const CompleteTodoFromScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteTodoFromSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCompleteTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<CompleteTodoFromScheduleMutation, CompleteTodoFromScheduleMutationVariables>;
export const GetHabitDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHabitDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"habitId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periods"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myHabitDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"habitId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"habitId"}}},{"kind":"Argument","name":{"kind":"Name","value":"periods"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periods"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"habitId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyCount"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyUnit"}},{"kind":"Field","name":{"kind":"Name","value":"totalCompletions"}},{"kind":"Field","name":{"kind":"Name","value":"allTimeRate"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"periods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"periodStart"}},{"kind":"Field","name":{"kind":"Name","value":"periodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"completions"}},{"kind":"Field","name":{"kind":"Name","value":"target"}},{"kind":"Field","name":{"kind":"Name","value":"rate"}}]}}]}}]}}]} as unknown as DocumentNode<GetHabitDetailQuery, GetHabitDetailQueryVariables>;
export const CreateHabitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateHabit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateHabitArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateHabit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyCount"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyUnit"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroShortBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitsBeforeLongBreak"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroLongBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroMaxPerDay"}}]}}]}}]} as unknown as DocumentNode<CreateHabitMutation, CreateHabitMutationVariables>;
export const UpdateHabitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateHabit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateHabitArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateHabit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyCount"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyUnit"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroShortBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroUnitsBeforeLongBreak"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroLongBreakLength"}},{"kind":"Field","name":{"kind":"Name","value":"pomodoroMaxPerDay"}}]}}]}}]} as unknown as DocumentNode<UpdateHabitMutation, UpdateHabitMutationVariables>;
export const UpdateHabitEstimatedLengthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateHabitEstimatedLength"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateHabitArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateHabit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}}]}}]}}]} as unknown as DocumentNode<UpdateHabitEstimatedLengthMutation, UpdateHabitEstimatedLengthMutationVariables>;
export const GetActivityTypesForOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivityTypesForOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myActivityTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<GetActivityTypesForOnboardingQuery, GetActivityTypesForOnboardingQueryVariables>;
export const CreateActivityTypeOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateActivityTypeOnboarding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateActivityTypeArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateActivityType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<CreateActivityTypeOnboardingMutation, CreateActivityTypeOnboardingMutationVariables>;
export const GetMyHabitsForOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyHabitsForOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myHabits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyCount"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyUnit"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<GetMyHabitsForOnboardingQuery, GetMyHabitsForOnboardingQueryVariables>;
export const CreateHabitOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateHabitOnboarding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateHabitArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateHabit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<CreateHabitOnboardingMutation, CreateHabitOnboardingMutationVariables>;
export const GetMyTimeblocksForOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyTimeblocksForOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTimeBlocks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}}]} as unknown as DocumentNode<GetMyTimeblocksForOnboardingQuery, GetMyTimeblocksForOnboardingQueryVariables>;
export const CreateTimeBlockOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTimeBlockOnboarding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTimeBlockArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateTimeBlock"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}}]} as unknown as DocumentNode<CreateTimeBlockOnboardingMutation, CreateTimeBlockOnboardingMutationVariables>;
export const GetMyTodosForOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyTodosForOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTodos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<GetMyTodosForOnboardingQuery, GetMyTodosForOnboardingQueryVariables>;
export const CreateTodoOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTodoOnboarding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTodoArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<CreateTodoOnboardingMutation, CreateTodoOnboardingMutationVariables>;
export const MyApiKeysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyApiKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myApiKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"keyPrefix"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MyApiKeysQuery, MyApiKeysQueryVariables>;
export const MyRevokeApiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MyRevokeApiKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myRevokeApiKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<MyRevokeApiKeyMutation, MyRevokeApiKeyMutationVariables>;
export const MyCreateApiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MyCreateApiKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MyCreateApiKeyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateApiKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"keyPrefix"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<MyCreateApiKeyMutation, MyCreateApiKeyMutationVariables>;
export const CreateTimeBlockDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTimeBlock"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTimeBlockArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateTimeBlock"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}}]} as unknown as DocumentNode<CreateTimeBlockMutation, CreateTimeBlockMutationVariables>;
export const UpdateTimeBlockDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTimeBlock"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTimeBlockArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateTimeBlock"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}}]} as unknown as DocumentNode<UpdateTimeBlockMutation, UpdateTimeBlockMutationVariables>;
export const DeleteTimeBlockDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTimeBlock"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDeleteTimeBlock"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTimeBlockMutation, DeleteTimeBlockMutationVariables>;
export const QuickCreateTodoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"QuickCreateTodo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTodoArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<QuickCreateTodoMutation, QuickCreateTodoMutationVariables>;
export const CreateTodoListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTodoList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTodoListArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateTodoList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPriority"}},{"kind":"Field","name":{"kind":"Name","value":"defaultEstimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<CreateTodoListMutation, CreateTodoListMutationVariables>;
export const UpdateTodoListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTodoList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTodoListArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateTodoList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPriority"}},{"kind":"Field","name":{"kind":"Name","value":"defaultEstimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateTodoListMutation, UpdateTodoListMutationVariables>;
export const DeleteTodoListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTodoList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDeleteTodoList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTodoListMutation, DeleteTodoListMutationVariables>;
export const GetTodoListsForSelectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTodoListsForSelect"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTodoLists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPriority"}},{"kind":"Field","name":{"kind":"Name","value":"defaultEstimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<GetTodoListsForSelectQuery, GetTodoListsForSelectQueryVariables>;
export const CreateTodoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTodo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTodoArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCreateTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<CreateTodoMutation, CreateTodoMutationVariables>;
export const UpdateTodoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTodo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTodoArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateTodoMutation, UpdateTodoMutationVariables>;
export const CompleteTodoFromFormDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteTodoFromForm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCompleteTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<CompleteTodoFromFormMutation, CompleteTodoFromFormMutationVariables>;
export const UpdateTodoEstimatedLengthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTodoEstimatedLength"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTodoArgs"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}}]}}]}}]} as unknown as DocumentNode<UpdateTodoEstimatedLengthMutation, UpdateTodoEstimatedLengthMutationVariables>;
export const UncompleteTodoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UncompleteTodo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUpdateTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"completedAt"},"value":{"kind":"NullValue"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<UncompleteTodoMutation, UncompleteTodoMutationVariables>;
export const DeleteTodoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTodo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDeleteTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTodoMutation, DeleteTodoMutationVariables>;
export const TodoListsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"TodoListsUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTodoListsUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"deletedId"}},{"kind":"Field","name":{"kind":"Name","value":"todoList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TodoList_TodoListList"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoList_TodoListList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPriority"}},{"kind":"Field","name":{"kind":"Name","value":"defaultEstimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<TodoListsUpdatedSubscription, TodoListsUpdatedSubscriptionVariables>;
export const TodosUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"TodosUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTodosUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"deletedId"}},{"kind":"Field","name":{"kind":"Name","value":"todo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Todo_TodoList"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Todo_TodoList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Todo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedLength"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activityType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<TodosUpdatedSubscription, TodosUpdatedSubscriptionVariables>;