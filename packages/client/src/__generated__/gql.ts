/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetMyActivityTypesNative {\n    myActivityTypes {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n": typeof types.GetMyActivityTypesNativeDocument,
    "\n  mutation CreateActivityTypeNative($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n": typeof types.CreateActivityTypeNativeDocument,
    "\n  mutation UpdateActivityTypeNative($input: UpdateActivityTypeArgs!) {\n    myUpdateActivityType(input: $input) {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n": typeof types.UpdateActivityTypeNativeDocument,
    "\n  mutation DeleteActivityTypeNative($id: ID!) {\n    myDeleteActivityType(id: $id)\n  }\n": typeof types.DeleteActivityTypeNativeDocument,
    "\n  query GetActivityTypesPage {\n    myActivityTypes {\n      ...ActivityType_ActivityTypeList\n    }\n    activityTypeStats {\n      activityTypeId\n      totalTodos\n      completedTodos\n      totalHabits\n    }\n  }\n": typeof types.GetActivityTypesPageDocument,
    "\n  query GetCalendarData {\n    myTimeBlocks {\n      id\n      ...TimeBlock_CalendarView\n    }\n  }\n": typeof types.GetCalendarDataDocument,
    "\n  query MySchedule($weekStart: String, $timezone: String) {\n    mySchedule(weekStart: $weekStart, timezone: $timezone) {\n      id\n      ...ScheduledItem_CalendarView\n      ...ScheduledItem_ScheduleView\n    }\n  }\n": typeof types.MyScheduleDocument,
    "\n  mutation UpdateProfile($timezone: String!) {\n    myUpdateProfile(timezone: $timezone)\n  }\n": typeof types.UpdateProfileDocument,
    "\n  subscription DashboardTodoUpdated {\n    myTodosUpdated {\n      type\n      deletedId\n    }\n  }\n": typeof types.DashboardTodoUpdatedDocument,
    "\n  query GetMyHabitsNative {\n    myHabits {\n      ...Habit_HabitList\n    }\n  }\n": typeof types.GetMyHabitsNativeDocument,
    "\n  mutation CreateHabitNative($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      ...Habit_HabitList\n    }\n  }\n": typeof types.CreateHabitNativeDocument,
    "\n  mutation UpdateHabitNative($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      ...Habit_HabitList\n    }\n  }\n": typeof types.UpdateHabitNativeDocument,
    "\n  mutation DeleteHabitNative($id: ID!) {\n    myDeleteHabit(id: $id)\n  }\n": typeof types.DeleteHabitNativeDocument,
    "\n  query GetActivityTypesForHabitsNative {\n    myActivityTypes { id name color }\n  }\n": typeof types.GetActivityTypesForHabitsNativeDocument,
    "\n  query GetMyHabits {\n    myHabits {\n      ...Habit_HabitList\n    }\n  }\n": typeof types.GetMyHabitsDocument,
    "\n  query CheckOnboarded {\n    myActivityTypes {\n      id\n    }\n  }\n": typeof types.CheckOnboardedDocument,
    "\n  query GetMyStats($startDate: String, $endDate: String) {\n    myStats(startDate: $startDate, endDate: $endDate) {\n      weightedScore\n      habitScore\n      todoScore\n      habits {\n        habitId\n        title\n        completionRate\n        completions\n        target\n        frequencyUnit\n        frequencyCount\n        activityType {\n          id\n          color\n        }\n      }\n      todos {\n        total\n        completed\n        overdue\n        completionRate\n      }\n    }\n  }\n": typeof types.GetMyStatsDocument,
    "\n  query GetActivityTypeStatsWithRange($startDate: String, $endDate: String) {\n    activityTypeStats(startDate: $startDate, endDate: $endDate) {\n      activityTypeId\n      activityTypeName\n      totalTodos\n      completedTodos\n      totalHabits\n    }\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n": typeof types.GetActivityTypeStatsWithRangeDocument,
    "\n  query GetMyTimeBlocksNative {\n    myTimeBlocks {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n": typeof types.GetMyTimeBlocksNativeDocument,
    "\n  query GetActivityTypesForTimeBlocksNative {\n    myActivityTypes { id name color }\n  }\n": typeof types.GetActivityTypesForTimeBlocksNativeDocument,
    "\n  mutation CreateTimeBlockNative($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n": typeof types.CreateTimeBlockNativeDocument,
    "\n  mutation DeleteTimeBlockNative($id: ID!) {\n    myDeleteTimeBlock(id: $id)\n  }\n": typeof types.DeleteTimeBlockNativeDocument,
    "\n  query GetMyTimeBlocks {\n    myTimeBlocks {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n": typeof types.GetMyTimeBlocksDocument,
    "\n  query GetTodoListsPageNative {\n    myTodoLists {\n      ...TodoList_TodoListList\n    }\n    myTodos {\n      ...Todo_TodoList\n    }\n  }\n": typeof types.GetTodoListsPageNativeDocument,
    "\n  mutation CreateTodoListNative($input: CreateTodoListArgs!) {\n    myCreateTodoList(input: $input) {\n      ...TodoList_TodoListList\n    }\n  }\n": typeof types.CreateTodoListNativeDocument,
    "\n  mutation CreateTodoNative($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      ...Todo_TodoList\n    }\n  }\n": typeof types.CreateTodoNativeDocument,
    "\n  mutation CompleteTodoNative($id: ID!) {\n    myCompleteTodo(id: $id) {\n      id\n      completedAt\n    }\n  }\n": typeof types.CompleteTodoNativeDocument,
    "\n  mutation DeleteTodoNative($id: ID!) {\n    myDeleteTodo(id: $id)\n  }\n": typeof types.DeleteTodoNativeDocument,
    "\n  query GetTodoListsPage {\n    myTodoLists {\n      ...TodoList_TodoListList\n    }\n    myTodos {\n      ...Todo_TodoList\n    }\n  }\n": typeof types.GetTodoListsPageDocument,
    "\n  subscription TodoUpdated {\n    myTodosUpdated {\n      type\n      deletedId\n      todo {\n        ...Todo_TodoList\n      }\n    }\n  }\n": typeof types.TodoUpdatedDocument,
    "\n  subscription TodoListUpdated {\n    myTodoListsUpdated {\n      type\n      deletedId\n      todoList {\n        ...TodoList_TodoListList\n      }\n    }\n  }\n": typeof types.TodoListUpdatedDocument,
    "\n  mutation RequestMagicLink($email: String!) {\n    requestMagicLink(email: $email) {\n      ok\n      magicLink\n    }\n  }\n": typeof types.RequestMagicLinkDocument,
    "\n  mutation VerifyMagicLink($token: String!) {\n    verifyMagicLink(token: $token) {\n      token\n      userId\n    }\n  }\n": typeof types.VerifyMagicLinkDocument,
    "\n  mutation CompleteTodoFromDialog($id: ID!, $completedAt: String) {\n    myCompleteTodo(id: $id, completedAt: $completedAt) {\n      id\n      completedAt\n      scheduledAt\n    }\n  }\n": typeof types.CompleteTodoFromDialogDocument,
    "\n  mutation CompleteHabitFromDialog($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) {\n      id\n      completedAt\n      scheduledAt\n    }\n  }\n": typeof types.CompleteHabitFromDialogDocument,
    "\n  mutation CreateActivityType($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n": typeof types.CreateActivityTypeDocument,
    "\n  mutation UpdateActivityType($input: UpdateActivityTypeArgs!) {\n    myUpdateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n": typeof types.UpdateActivityTypeDocument,
    "\n  mutation DeleteActivityType($id: ID!) {\n    myDeleteActivityType(id: $id)\n  }\n": typeof types.DeleteActivityTypeDocument,
    "\n  fragment ActivityType_ActivityTypeList on ActivityType {\n    id\n    name\n    color\n  }\n": typeof types.ActivityType_ActivityTypeListFragmentDoc,
    "\n  query GetActivityTypesForSelect {\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n": typeof types.GetActivityTypesForSelectDocument,
    "\n  fragment TimeBlock_CalendarView on TimeBlock {\n    id\n    daysOfWeek\n    startTime\n    endTime\n    activityType {\n      id\n      name\n      color\n    }\n  }\n\n  fragment ScheduledItem_CalendarView on ScheduledItem {\n    kind\n    id\n    title\n    isScheduled\n    isOverdue\n    scheduledStart\n    scheduledEnd\n    completedAt\n    activityType {\n      id\n      name\n      color\n    }\n  }\n": typeof types.TimeBlock_CalendarViewFragmentDoc,
    "\n  mutation PinTodo($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) { id scheduledAt manuallyScheduled }\n  }\n": typeof types.PinTodoDocument,
    "\n  mutation CompleteHabitFromCalendar($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) { __typename id completedAt }\n  }\n": typeof types.CompleteHabitFromCalendarDocument,
    "\n  mutation CompleteTodoFromCalendar($id: ID!) {\n    myCompleteTodo(id: $id) { __typename id completedAt }\n  }\n": typeof types.CompleteTodoFromCalendarDocument,
    "\n  fragment ScheduledItem_ScheduleView on ScheduledItem {\n    kind\n    id\n    title\n    priority\n    estimatedLength\n    isScheduled\n    scheduledStart\n    scheduledEnd\n    activityType {\n      id\n      name\n      color\n    }\n  }\n": typeof types.ScheduledItem_ScheduleViewFragmentDoc,
    "\n  mutation CompleteHabitFromSchedule($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) {\n      __typename\n      id\n      completedAt\n    }\n  }\n": typeof types.CompleteHabitFromScheduleDocument,
    "\n  mutation CompleteTodoFromSchedule($id: ID!) {\n    myCompleteTodo(id: $id) {\n      __typename\n      id\n      completedAt\n    }\n  }\n": typeof types.CompleteTodoFromScheduleDocument,
    "\n  query GetHabitDetail($habitId: ID!, $periods: Int) {\n    myHabitDetail(habitId: $habitId, periods: $periods) {\n      habitId\n      title\n      description\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      totalCompletions\n      allTimeRate\n      activityType {\n        id\n        name\n        color\n      }\n      periods {\n        label\n        periodStart\n        periodEnd\n        completions\n        target\n        rate\n      }\n    }\n  }\n": typeof types.GetHabitDetailDocument,
    "\n  mutation CreateHabit($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      id\n      title\n      description\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      pomodoroEnabled\n      pomodoroUnitLength\n      pomodoroShortBreakLength\n      pomodoroUnitsBeforeLongBreak\n      pomodoroLongBreakLength\n    }\n  }\n": typeof types.CreateHabitDocument,
    "\n  mutation UpdateHabit($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      id\n      title\n      description\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      pomodoroEnabled\n      pomodoroUnitLength\n      pomodoroShortBreakLength\n      pomodoroUnitsBeforeLongBreak\n      pomodoroLongBreakLength\n    }\n  }\n": typeof types.UpdateHabitDocument,
    "\n  mutation UpdateHabitEstimatedLength($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      id\n      estimatedLength\n    }\n  }\n": typeof types.UpdateHabitEstimatedLengthDocument,
    "\n  fragment Habit_HabitList on Habit {\n    id\n    title\n    description\n    priority\n    estimatedLength\n    activityType {\n      id\n      name\n      color\n    }\n    frequencyCount\n    frequencyUnit\n    minTimeBetweenInstances\n    pomodoroEnabled\n    pomodoroUnitLength\n    pomodoroShortBreakLength\n    pomodoroUnitsBeforeLongBreak\n    pomodoroLongBreakLength\n    createdAt\n  }\n": typeof types.Habit_HabitListFragmentDoc,
    "\n  query GetActivityTypesForOnboarding {\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n": typeof types.GetActivityTypesForOnboardingDocument,
    "\n  mutation CreateActivityTypeOnboarding($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n": typeof types.CreateActivityTypeOnboardingDocument,
    "\n  query GetMyHabitsForOnboarding {\n    myHabits {\n      id\n      title\n      frequencyCount\n      frequencyUnit\n      activityType { id name color }\n    }\n  }\n": typeof types.GetMyHabitsForOnboardingDocument,
    "\n  mutation CreateHabitOnboarding($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      id\n      title\n    }\n  }\n": typeof types.CreateHabitOnboardingDocument,
    "\n  query GetMyTimeblocksForOnboarding {\n    myTimeBlocks {\n      id\n      activityType { id name color }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n": typeof types.GetMyTimeblocksForOnboardingDocument,
    "\n  mutation CreateTimeBlockOnboarding($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      id\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n": typeof types.CreateTimeBlockOnboardingDocument,
    "\n  query GetMyTodosForOnboarding {\n    myTodos {\n      id\n      title\n      priority\n      list { id name }\n      activityType { id name color }\n    }\n  }\n": typeof types.GetMyTodosForOnboardingDocument,
    "\n  mutation CreateTodoOnboarding($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n    }\n  }\n": typeof types.CreateTodoOnboardingDocument,
    "\n  query MyApiKeys {\n    myApiKeys {\n      id\n      name\n      keyPrefix\n      scopes\n      lastUsedAt\n      expiresAt\n      createdAt\n    }\n  }\n": typeof types.MyApiKeysDocument,
    "\n  mutation MyRevokeApiKey($id: ID!) {\n    myRevokeApiKey(id: $id)\n  }\n": typeof types.MyRevokeApiKeyDocument,
    "\n  mutation MyCreateApiKey($input: MyCreateApiKeyInput!) {\n    myCreateApiKey(input: $input) {\n      apiKey {\n        id\n        name\n        keyPrefix\n        scopes\n        createdAt\n      }\n      token\n    }\n  }\n": typeof types.MyCreateApiKeyDocument,
    "\n  mutation CreateTimeBlock($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      id\n      activityType {\n        id\n        name\n        color\n      }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n": typeof types.CreateTimeBlockDocument,
    "\n  mutation UpdateTimeBlock($input: UpdateTimeBlockArgs!) {\n    myUpdateTimeBlock(input: $input) {\n      id\n      activityType {\n        id\n        name\n        color\n      }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n": typeof types.UpdateTimeBlockDocument,
    "\n  fragment TimeBlock_TimeBlockList on TimeBlock {\n    id\n    activityType {\n      id\n      name\n      color\n    }\n    daysOfWeek\n    startTime\n    endTime\n    priority\n    createdAt\n  }\n": typeof types.TimeBlock_TimeBlockListFragmentDoc,
    "\n  mutation QuickCreateTodo($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n    }\n  }\n": typeof types.QuickCreateTodoDocument,
    "\n  mutation CreateTodoList($input: CreateTodoListArgs!) {\n    myCreateTodoList(input: $input) {\n      id\n      name\n      description\n      defaultPriority\n      defaultEstimatedLength\n      activityType { id name color }\n    }\n  }\n": typeof types.CreateTodoListDocument,
    "\n  mutation UpdateTodoList($input: UpdateTodoListArgs!) {\n    myUpdateTodoList(input: $input) {\n      id\n      name\n      description\n      defaultPriority\n      defaultEstimatedLength\n      activityType { id name color }\n    }\n  }\n": typeof types.UpdateTodoListDocument,
    "\n  mutation DeleteTodoList($id: ID!) {\n    myDeleteTodoList(id: $id)\n  }\n": typeof types.DeleteTodoListDocument,
    "\n  fragment TodoList_TodoListList on TodoList {\n    id\n    name\n    description\n    defaultPriority\n    defaultEstimatedLength\n    activityType {\n      id\n      name\n      color\n    }\n  }\n": typeof types.TodoList_TodoListListFragmentDoc,
    "\n  query GetTodoListsForSelect {\n    myTodoLists {\n      id\n      name\n      defaultPriority\n      defaultEstimatedLength\n      activityType {\n        id\n        name\n        color\n      }\n    }\n  }\n": typeof types.GetTodoListsForSelectDocument,
    "\n  mutation CreateTodo($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n      description\n      list { id name }\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      dueAt\n      scheduledAt\n      completedAt\n    }\n  }\n": typeof types.CreateTodoDocument,
    "\n  mutation UpdateTodo($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) {\n      id\n      title\n      description\n      list { id name }\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      dueAt\n      scheduledAt\n      completedAt\n    }\n  }\n": typeof types.UpdateTodoDocument,
    "\n  mutation CompleteTodoFromForm($id: ID!) {\n    myCompleteTodo(id: $id) {\n      id\n      completedAt\n    }\n  }\n": typeof types.CompleteTodoFromFormDocument,
    "\n  fragment Todo_TodoList on Todo {\n    id\n    title\n    description\n    priority\n    estimatedLength\n    list {\n      id\n      name\n    }\n    activityType {\n      id\n      name\n      color\n    }\n    dueAt\n    scheduledAt\n    completedAt\n    createdAt\n  }\n": typeof types.Todo_TodoListFragmentDoc,
    "\n  mutation UpdateTodoEstimatedLength($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) {\n      id\n      estimatedLength\n    }\n  }\n": typeof types.UpdateTodoEstimatedLengthDocument,
    "\n  mutation UncompleteTodo($id: ID!) {\n    myUpdateTodo(input: { id: $id, completedAt: null }) {\n      id\n      completedAt\n    }\n  }\n": typeof types.UncompleteTodoDocument,
    "\n  mutation DeleteTodo($id: ID!) {\n    myDeleteTodo(id: $id)\n  }\n": typeof types.DeleteTodoDocument,
};
const documents: Documents = {
    "\n  query GetMyActivityTypesNative {\n    myActivityTypes {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n": types.GetMyActivityTypesNativeDocument,
    "\n  mutation CreateActivityTypeNative($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n": types.CreateActivityTypeNativeDocument,
    "\n  mutation UpdateActivityTypeNative($input: UpdateActivityTypeArgs!) {\n    myUpdateActivityType(input: $input) {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n": types.UpdateActivityTypeNativeDocument,
    "\n  mutation DeleteActivityTypeNative($id: ID!) {\n    myDeleteActivityType(id: $id)\n  }\n": types.DeleteActivityTypeNativeDocument,
    "\n  query GetActivityTypesPage {\n    myActivityTypes {\n      ...ActivityType_ActivityTypeList\n    }\n    activityTypeStats {\n      activityTypeId\n      totalTodos\n      completedTodos\n      totalHabits\n    }\n  }\n": types.GetActivityTypesPageDocument,
    "\n  query GetCalendarData {\n    myTimeBlocks {\n      id\n      ...TimeBlock_CalendarView\n    }\n  }\n": types.GetCalendarDataDocument,
    "\n  query MySchedule($weekStart: String, $timezone: String) {\n    mySchedule(weekStart: $weekStart, timezone: $timezone) {\n      id\n      ...ScheduledItem_CalendarView\n      ...ScheduledItem_ScheduleView\n    }\n  }\n": types.MyScheduleDocument,
    "\n  mutation UpdateProfile($timezone: String!) {\n    myUpdateProfile(timezone: $timezone)\n  }\n": types.UpdateProfileDocument,
    "\n  subscription DashboardTodoUpdated {\n    myTodosUpdated {\n      type\n      deletedId\n    }\n  }\n": types.DashboardTodoUpdatedDocument,
    "\n  query GetMyHabitsNative {\n    myHabits {\n      ...Habit_HabitList\n    }\n  }\n": types.GetMyHabitsNativeDocument,
    "\n  mutation CreateHabitNative($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      ...Habit_HabitList\n    }\n  }\n": types.CreateHabitNativeDocument,
    "\n  mutation UpdateHabitNative($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      ...Habit_HabitList\n    }\n  }\n": types.UpdateHabitNativeDocument,
    "\n  mutation DeleteHabitNative($id: ID!) {\n    myDeleteHabit(id: $id)\n  }\n": types.DeleteHabitNativeDocument,
    "\n  query GetActivityTypesForHabitsNative {\n    myActivityTypes { id name color }\n  }\n": types.GetActivityTypesForHabitsNativeDocument,
    "\n  query GetMyHabits {\n    myHabits {\n      ...Habit_HabitList\n    }\n  }\n": types.GetMyHabitsDocument,
    "\n  query CheckOnboarded {\n    myActivityTypes {\n      id\n    }\n  }\n": types.CheckOnboardedDocument,
    "\n  query GetMyStats($startDate: String, $endDate: String) {\n    myStats(startDate: $startDate, endDate: $endDate) {\n      weightedScore\n      habitScore\n      todoScore\n      habits {\n        habitId\n        title\n        completionRate\n        completions\n        target\n        frequencyUnit\n        frequencyCount\n        activityType {\n          id\n          color\n        }\n      }\n      todos {\n        total\n        completed\n        overdue\n        completionRate\n      }\n    }\n  }\n": types.GetMyStatsDocument,
    "\n  query GetActivityTypeStatsWithRange($startDate: String, $endDate: String) {\n    activityTypeStats(startDate: $startDate, endDate: $endDate) {\n      activityTypeId\n      activityTypeName\n      totalTodos\n      completedTodos\n      totalHabits\n    }\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n": types.GetActivityTypeStatsWithRangeDocument,
    "\n  query GetMyTimeBlocksNative {\n    myTimeBlocks {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n": types.GetMyTimeBlocksNativeDocument,
    "\n  query GetActivityTypesForTimeBlocksNative {\n    myActivityTypes { id name color }\n  }\n": types.GetActivityTypesForTimeBlocksNativeDocument,
    "\n  mutation CreateTimeBlockNative($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n": types.CreateTimeBlockNativeDocument,
    "\n  mutation DeleteTimeBlockNative($id: ID!) {\n    myDeleteTimeBlock(id: $id)\n  }\n": types.DeleteTimeBlockNativeDocument,
    "\n  query GetMyTimeBlocks {\n    myTimeBlocks {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n": types.GetMyTimeBlocksDocument,
    "\n  query GetTodoListsPageNative {\n    myTodoLists {\n      ...TodoList_TodoListList\n    }\n    myTodos {\n      ...Todo_TodoList\n    }\n  }\n": types.GetTodoListsPageNativeDocument,
    "\n  mutation CreateTodoListNative($input: CreateTodoListArgs!) {\n    myCreateTodoList(input: $input) {\n      ...TodoList_TodoListList\n    }\n  }\n": types.CreateTodoListNativeDocument,
    "\n  mutation CreateTodoNative($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      ...Todo_TodoList\n    }\n  }\n": types.CreateTodoNativeDocument,
    "\n  mutation CompleteTodoNative($id: ID!) {\n    myCompleteTodo(id: $id) {\n      id\n      completedAt\n    }\n  }\n": types.CompleteTodoNativeDocument,
    "\n  mutation DeleteTodoNative($id: ID!) {\n    myDeleteTodo(id: $id)\n  }\n": types.DeleteTodoNativeDocument,
    "\n  query GetTodoListsPage {\n    myTodoLists {\n      ...TodoList_TodoListList\n    }\n    myTodos {\n      ...Todo_TodoList\n    }\n  }\n": types.GetTodoListsPageDocument,
    "\n  subscription TodoUpdated {\n    myTodosUpdated {\n      type\n      deletedId\n      todo {\n        ...Todo_TodoList\n      }\n    }\n  }\n": types.TodoUpdatedDocument,
    "\n  subscription TodoListUpdated {\n    myTodoListsUpdated {\n      type\n      deletedId\n      todoList {\n        ...TodoList_TodoListList\n      }\n    }\n  }\n": types.TodoListUpdatedDocument,
    "\n  mutation RequestMagicLink($email: String!) {\n    requestMagicLink(email: $email) {\n      ok\n      magicLink\n    }\n  }\n": types.RequestMagicLinkDocument,
    "\n  mutation VerifyMagicLink($token: String!) {\n    verifyMagicLink(token: $token) {\n      token\n      userId\n    }\n  }\n": types.VerifyMagicLinkDocument,
    "\n  mutation CompleteTodoFromDialog($id: ID!, $completedAt: String) {\n    myCompleteTodo(id: $id, completedAt: $completedAt) {\n      id\n      completedAt\n      scheduledAt\n    }\n  }\n": types.CompleteTodoFromDialogDocument,
    "\n  mutation CompleteHabitFromDialog($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) {\n      id\n      completedAt\n      scheduledAt\n    }\n  }\n": types.CompleteHabitFromDialogDocument,
    "\n  mutation CreateActivityType($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n": types.CreateActivityTypeDocument,
    "\n  mutation UpdateActivityType($input: UpdateActivityTypeArgs!) {\n    myUpdateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n": types.UpdateActivityTypeDocument,
    "\n  mutation DeleteActivityType($id: ID!) {\n    myDeleteActivityType(id: $id)\n  }\n": types.DeleteActivityTypeDocument,
    "\n  fragment ActivityType_ActivityTypeList on ActivityType {\n    id\n    name\n    color\n  }\n": types.ActivityType_ActivityTypeListFragmentDoc,
    "\n  query GetActivityTypesForSelect {\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n": types.GetActivityTypesForSelectDocument,
    "\n  fragment TimeBlock_CalendarView on TimeBlock {\n    id\n    daysOfWeek\n    startTime\n    endTime\n    activityType {\n      id\n      name\n      color\n    }\n  }\n\n  fragment ScheduledItem_CalendarView on ScheduledItem {\n    kind\n    id\n    title\n    isScheduled\n    isOverdue\n    scheduledStart\n    scheduledEnd\n    completedAt\n    activityType {\n      id\n      name\n      color\n    }\n  }\n": types.TimeBlock_CalendarViewFragmentDoc,
    "\n  mutation PinTodo($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) { id scheduledAt manuallyScheduled }\n  }\n": types.PinTodoDocument,
    "\n  mutation CompleteHabitFromCalendar($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) { __typename id completedAt }\n  }\n": types.CompleteHabitFromCalendarDocument,
    "\n  mutation CompleteTodoFromCalendar($id: ID!) {\n    myCompleteTodo(id: $id) { __typename id completedAt }\n  }\n": types.CompleteTodoFromCalendarDocument,
    "\n  fragment ScheduledItem_ScheduleView on ScheduledItem {\n    kind\n    id\n    title\n    priority\n    estimatedLength\n    isScheduled\n    scheduledStart\n    scheduledEnd\n    activityType {\n      id\n      name\n      color\n    }\n  }\n": types.ScheduledItem_ScheduleViewFragmentDoc,
    "\n  mutation CompleteHabitFromSchedule($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) {\n      __typename\n      id\n      completedAt\n    }\n  }\n": types.CompleteHabitFromScheduleDocument,
    "\n  mutation CompleteTodoFromSchedule($id: ID!) {\n    myCompleteTodo(id: $id) {\n      __typename\n      id\n      completedAt\n    }\n  }\n": types.CompleteTodoFromScheduleDocument,
    "\n  query GetHabitDetail($habitId: ID!, $periods: Int) {\n    myHabitDetail(habitId: $habitId, periods: $periods) {\n      habitId\n      title\n      description\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      totalCompletions\n      allTimeRate\n      activityType {\n        id\n        name\n        color\n      }\n      periods {\n        label\n        periodStart\n        periodEnd\n        completions\n        target\n        rate\n      }\n    }\n  }\n": types.GetHabitDetailDocument,
    "\n  mutation CreateHabit($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      id\n      title\n      description\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      pomodoroEnabled\n      pomodoroUnitLength\n      pomodoroShortBreakLength\n      pomodoroUnitsBeforeLongBreak\n      pomodoroLongBreakLength\n    }\n  }\n": types.CreateHabitDocument,
    "\n  mutation UpdateHabit($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      id\n      title\n      description\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      pomodoroEnabled\n      pomodoroUnitLength\n      pomodoroShortBreakLength\n      pomodoroUnitsBeforeLongBreak\n      pomodoroLongBreakLength\n    }\n  }\n": types.UpdateHabitDocument,
    "\n  mutation UpdateHabitEstimatedLength($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      id\n      estimatedLength\n    }\n  }\n": types.UpdateHabitEstimatedLengthDocument,
    "\n  fragment Habit_HabitList on Habit {\n    id\n    title\n    description\n    priority\n    estimatedLength\n    activityType {\n      id\n      name\n      color\n    }\n    frequencyCount\n    frequencyUnit\n    minTimeBetweenInstances\n    pomodoroEnabled\n    pomodoroUnitLength\n    pomodoroShortBreakLength\n    pomodoroUnitsBeforeLongBreak\n    pomodoroLongBreakLength\n    createdAt\n  }\n": types.Habit_HabitListFragmentDoc,
    "\n  query GetActivityTypesForOnboarding {\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n": types.GetActivityTypesForOnboardingDocument,
    "\n  mutation CreateActivityTypeOnboarding($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n": types.CreateActivityTypeOnboardingDocument,
    "\n  query GetMyHabitsForOnboarding {\n    myHabits {\n      id\n      title\n      frequencyCount\n      frequencyUnit\n      activityType { id name color }\n    }\n  }\n": types.GetMyHabitsForOnboardingDocument,
    "\n  mutation CreateHabitOnboarding($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      id\n      title\n    }\n  }\n": types.CreateHabitOnboardingDocument,
    "\n  query GetMyTimeblocksForOnboarding {\n    myTimeBlocks {\n      id\n      activityType { id name color }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n": types.GetMyTimeblocksForOnboardingDocument,
    "\n  mutation CreateTimeBlockOnboarding($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      id\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n": types.CreateTimeBlockOnboardingDocument,
    "\n  query GetMyTodosForOnboarding {\n    myTodos {\n      id\n      title\n      priority\n      list { id name }\n      activityType { id name color }\n    }\n  }\n": types.GetMyTodosForOnboardingDocument,
    "\n  mutation CreateTodoOnboarding($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n    }\n  }\n": types.CreateTodoOnboardingDocument,
    "\n  query MyApiKeys {\n    myApiKeys {\n      id\n      name\n      keyPrefix\n      scopes\n      lastUsedAt\n      expiresAt\n      createdAt\n    }\n  }\n": types.MyApiKeysDocument,
    "\n  mutation MyRevokeApiKey($id: ID!) {\n    myRevokeApiKey(id: $id)\n  }\n": types.MyRevokeApiKeyDocument,
    "\n  mutation MyCreateApiKey($input: MyCreateApiKeyInput!) {\n    myCreateApiKey(input: $input) {\n      apiKey {\n        id\n        name\n        keyPrefix\n        scopes\n        createdAt\n      }\n      token\n    }\n  }\n": types.MyCreateApiKeyDocument,
    "\n  mutation CreateTimeBlock($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      id\n      activityType {\n        id\n        name\n        color\n      }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n": types.CreateTimeBlockDocument,
    "\n  mutation UpdateTimeBlock($input: UpdateTimeBlockArgs!) {\n    myUpdateTimeBlock(input: $input) {\n      id\n      activityType {\n        id\n        name\n        color\n      }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n": types.UpdateTimeBlockDocument,
    "\n  fragment TimeBlock_TimeBlockList on TimeBlock {\n    id\n    activityType {\n      id\n      name\n      color\n    }\n    daysOfWeek\n    startTime\n    endTime\n    priority\n    createdAt\n  }\n": types.TimeBlock_TimeBlockListFragmentDoc,
    "\n  mutation QuickCreateTodo($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n    }\n  }\n": types.QuickCreateTodoDocument,
    "\n  mutation CreateTodoList($input: CreateTodoListArgs!) {\n    myCreateTodoList(input: $input) {\n      id\n      name\n      description\n      defaultPriority\n      defaultEstimatedLength\n      activityType { id name color }\n    }\n  }\n": types.CreateTodoListDocument,
    "\n  mutation UpdateTodoList($input: UpdateTodoListArgs!) {\n    myUpdateTodoList(input: $input) {\n      id\n      name\n      description\n      defaultPriority\n      defaultEstimatedLength\n      activityType { id name color }\n    }\n  }\n": types.UpdateTodoListDocument,
    "\n  mutation DeleteTodoList($id: ID!) {\n    myDeleteTodoList(id: $id)\n  }\n": types.DeleteTodoListDocument,
    "\n  fragment TodoList_TodoListList on TodoList {\n    id\n    name\n    description\n    defaultPriority\n    defaultEstimatedLength\n    activityType {\n      id\n      name\n      color\n    }\n  }\n": types.TodoList_TodoListListFragmentDoc,
    "\n  query GetTodoListsForSelect {\n    myTodoLists {\n      id\n      name\n      defaultPriority\n      defaultEstimatedLength\n      activityType {\n        id\n        name\n        color\n      }\n    }\n  }\n": types.GetTodoListsForSelectDocument,
    "\n  mutation CreateTodo($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n      description\n      list { id name }\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      dueAt\n      scheduledAt\n      completedAt\n    }\n  }\n": types.CreateTodoDocument,
    "\n  mutation UpdateTodo($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) {\n      id\n      title\n      description\n      list { id name }\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      dueAt\n      scheduledAt\n      completedAt\n    }\n  }\n": types.UpdateTodoDocument,
    "\n  mutation CompleteTodoFromForm($id: ID!) {\n    myCompleteTodo(id: $id) {\n      id\n      completedAt\n    }\n  }\n": types.CompleteTodoFromFormDocument,
    "\n  fragment Todo_TodoList on Todo {\n    id\n    title\n    description\n    priority\n    estimatedLength\n    list {\n      id\n      name\n    }\n    activityType {\n      id\n      name\n      color\n    }\n    dueAt\n    scheduledAt\n    completedAt\n    createdAt\n  }\n": types.Todo_TodoListFragmentDoc,
    "\n  mutation UpdateTodoEstimatedLength($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) {\n      id\n      estimatedLength\n    }\n  }\n": types.UpdateTodoEstimatedLengthDocument,
    "\n  mutation UncompleteTodo($id: ID!) {\n    myUpdateTodo(input: { id: $id, completedAt: null }) {\n      id\n      completedAt\n    }\n  }\n": types.UncompleteTodoDocument,
    "\n  mutation DeleteTodo($id: ID!) {\n    myDeleteTodo(id: $id)\n  }\n": types.DeleteTodoDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyActivityTypesNative {\n    myActivityTypes {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n"): (typeof documents)["\n  query GetMyActivityTypesNative {\n    myActivityTypes {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateActivityTypeNative($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n"): (typeof documents)["\n  mutation CreateActivityTypeNative($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateActivityTypeNative($input: UpdateActivityTypeArgs!) {\n    myUpdateActivityType(input: $input) {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateActivityTypeNative($input: UpdateActivityTypeArgs!) {\n    myUpdateActivityType(input: $input) {\n      ...ActivityType_ActivityTypeList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteActivityTypeNative($id: ID!) {\n    myDeleteActivityType(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteActivityTypeNative($id: ID!) {\n    myDeleteActivityType(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetActivityTypesPage {\n    myActivityTypes {\n      ...ActivityType_ActivityTypeList\n    }\n    activityTypeStats {\n      activityTypeId\n      totalTodos\n      completedTodos\n      totalHabits\n    }\n  }\n"): (typeof documents)["\n  query GetActivityTypesPage {\n    myActivityTypes {\n      ...ActivityType_ActivityTypeList\n    }\n    activityTypeStats {\n      activityTypeId\n      totalTodos\n      completedTodos\n      totalHabits\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetCalendarData {\n    myTimeBlocks {\n      id\n      ...TimeBlock_CalendarView\n    }\n  }\n"): (typeof documents)["\n  query GetCalendarData {\n    myTimeBlocks {\n      id\n      ...TimeBlock_CalendarView\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MySchedule($weekStart: String, $timezone: String) {\n    mySchedule(weekStart: $weekStart, timezone: $timezone) {\n      id\n      ...ScheduledItem_CalendarView\n      ...ScheduledItem_ScheduleView\n    }\n  }\n"): (typeof documents)["\n  query MySchedule($weekStart: String, $timezone: String) {\n    mySchedule(weekStart: $weekStart, timezone: $timezone) {\n      id\n      ...ScheduledItem_CalendarView\n      ...ScheduledItem_ScheduleView\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProfile($timezone: String!) {\n    myUpdateProfile(timezone: $timezone)\n  }\n"): (typeof documents)["\n  mutation UpdateProfile($timezone: String!) {\n    myUpdateProfile(timezone: $timezone)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DashboardTodoUpdated {\n    myTodosUpdated {\n      type\n      deletedId\n    }\n  }\n"): (typeof documents)["\n  subscription DashboardTodoUpdated {\n    myTodosUpdated {\n      type\n      deletedId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyHabitsNative {\n    myHabits {\n      ...Habit_HabitList\n    }\n  }\n"): (typeof documents)["\n  query GetMyHabitsNative {\n    myHabits {\n      ...Habit_HabitList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateHabitNative($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      ...Habit_HabitList\n    }\n  }\n"): (typeof documents)["\n  mutation CreateHabitNative($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      ...Habit_HabitList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateHabitNative($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      ...Habit_HabitList\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateHabitNative($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      ...Habit_HabitList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteHabitNative($id: ID!) {\n    myDeleteHabit(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteHabitNative($id: ID!) {\n    myDeleteHabit(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetActivityTypesForHabitsNative {\n    myActivityTypes { id name color }\n  }\n"): (typeof documents)["\n  query GetActivityTypesForHabitsNative {\n    myActivityTypes { id name color }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyHabits {\n    myHabits {\n      ...Habit_HabitList\n    }\n  }\n"): (typeof documents)["\n  query GetMyHabits {\n    myHabits {\n      ...Habit_HabitList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CheckOnboarded {\n    myActivityTypes {\n      id\n    }\n  }\n"): (typeof documents)["\n  query CheckOnboarded {\n    myActivityTypes {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyStats($startDate: String, $endDate: String) {\n    myStats(startDate: $startDate, endDate: $endDate) {\n      weightedScore\n      habitScore\n      todoScore\n      habits {\n        habitId\n        title\n        completionRate\n        completions\n        target\n        frequencyUnit\n        frequencyCount\n        activityType {\n          id\n          color\n        }\n      }\n      todos {\n        total\n        completed\n        overdue\n        completionRate\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetMyStats($startDate: String, $endDate: String) {\n    myStats(startDate: $startDate, endDate: $endDate) {\n      weightedScore\n      habitScore\n      todoScore\n      habits {\n        habitId\n        title\n        completionRate\n        completions\n        target\n        frequencyUnit\n        frequencyCount\n        activityType {\n          id\n          color\n        }\n      }\n      todos {\n        total\n        completed\n        overdue\n        completionRate\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetActivityTypeStatsWithRange($startDate: String, $endDate: String) {\n    activityTypeStats(startDate: $startDate, endDate: $endDate) {\n      activityTypeId\n      activityTypeName\n      totalTodos\n      completedTodos\n      totalHabits\n    }\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n"): (typeof documents)["\n  query GetActivityTypeStatsWithRange($startDate: String, $endDate: String) {\n    activityTypeStats(startDate: $startDate, endDate: $endDate) {\n      activityTypeId\n      activityTypeName\n      totalTodos\n      completedTodos\n      totalHabits\n    }\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyTimeBlocksNative {\n    myTimeBlocks {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n"): (typeof documents)["\n  query GetMyTimeBlocksNative {\n    myTimeBlocks {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetActivityTypesForTimeBlocksNative {\n    myActivityTypes { id name color }\n  }\n"): (typeof documents)["\n  query GetActivityTypesForTimeBlocksNative {\n    myActivityTypes { id name color }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTimeBlockNative($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTimeBlockNative($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTimeBlockNative($id: ID!) {\n    myDeleteTimeBlock(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTimeBlockNative($id: ID!) {\n    myDeleteTimeBlock(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyTimeBlocks {\n    myTimeBlocks {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n"): (typeof documents)["\n  query GetMyTimeBlocks {\n    myTimeBlocks {\n      ...TimeBlock_TimeBlockList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTodoListsPageNative {\n    myTodoLists {\n      ...TodoList_TodoListList\n    }\n    myTodos {\n      ...Todo_TodoList\n    }\n  }\n"): (typeof documents)["\n  query GetTodoListsPageNative {\n    myTodoLists {\n      ...TodoList_TodoListList\n    }\n    myTodos {\n      ...Todo_TodoList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTodoListNative($input: CreateTodoListArgs!) {\n    myCreateTodoList(input: $input) {\n      ...TodoList_TodoListList\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTodoListNative($input: CreateTodoListArgs!) {\n    myCreateTodoList(input: $input) {\n      ...TodoList_TodoListList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTodoNative($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      ...Todo_TodoList\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTodoNative($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      ...Todo_TodoList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteTodoNative($id: ID!) {\n    myCompleteTodo(id: $id) {\n      id\n      completedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CompleteTodoNative($id: ID!) {\n    myCompleteTodo(id: $id) {\n      id\n      completedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTodoNative($id: ID!) {\n    myDeleteTodo(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTodoNative($id: ID!) {\n    myDeleteTodo(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTodoListsPage {\n    myTodoLists {\n      ...TodoList_TodoListList\n    }\n    myTodos {\n      ...Todo_TodoList\n    }\n  }\n"): (typeof documents)["\n  query GetTodoListsPage {\n    myTodoLists {\n      ...TodoList_TodoListList\n    }\n    myTodos {\n      ...Todo_TodoList\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription TodoUpdated {\n    myTodosUpdated {\n      type\n      deletedId\n      todo {\n        ...Todo_TodoList\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription TodoUpdated {\n    myTodosUpdated {\n      type\n      deletedId\n      todo {\n        ...Todo_TodoList\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription TodoListUpdated {\n    myTodoListsUpdated {\n      type\n      deletedId\n      todoList {\n        ...TodoList_TodoListList\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription TodoListUpdated {\n    myTodoListsUpdated {\n      type\n      deletedId\n      todoList {\n        ...TodoList_TodoListList\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestMagicLink($email: String!) {\n    requestMagicLink(email: $email) {\n      ok\n      magicLink\n    }\n  }\n"): (typeof documents)["\n  mutation RequestMagicLink($email: String!) {\n    requestMagicLink(email: $email) {\n      ok\n      magicLink\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyMagicLink($token: String!) {\n    verifyMagicLink(token: $token) {\n      token\n      userId\n    }\n  }\n"): (typeof documents)["\n  mutation VerifyMagicLink($token: String!) {\n    verifyMagicLink(token: $token) {\n      token\n      userId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteTodoFromDialog($id: ID!, $completedAt: String) {\n    myCompleteTodo(id: $id, completedAt: $completedAt) {\n      id\n      completedAt\n      scheduledAt\n    }\n  }\n"): (typeof documents)["\n  mutation CompleteTodoFromDialog($id: ID!, $completedAt: String) {\n    myCompleteTodo(id: $id, completedAt: $completedAt) {\n      id\n      completedAt\n      scheduledAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteHabitFromDialog($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) {\n      id\n      completedAt\n      scheduledAt\n    }\n  }\n"): (typeof documents)["\n  mutation CompleteHabitFromDialog($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) {\n      id\n      completedAt\n      scheduledAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateActivityType($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n"): (typeof documents)["\n  mutation CreateActivityType($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateActivityType($input: UpdateActivityTypeArgs!) {\n    myUpdateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateActivityType($input: UpdateActivityTypeArgs!) {\n    myUpdateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteActivityType($id: ID!) {\n    myDeleteActivityType(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteActivityType($id: ID!) {\n    myDeleteActivityType(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ActivityType_ActivityTypeList on ActivityType {\n    id\n    name\n    color\n  }\n"): (typeof documents)["\n  fragment ActivityType_ActivityTypeList on ActivityType {\n    id\n    name\n    color\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetActivityTypesForSelect {\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n"): (typeof documents)["\n  query GetActivityTypesForSelect {\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TimeBlock_CalendarView on TimeBlock {\n    id\n    daysOfWeek\n    startTime\n    endTime\n    activityType {\n      id\n      name\n      color\n    }\n  }\n\n  fragment ScheduledItem_CalendarView on ScheduledItem {\n    kind\n    id\n    title\n    isScheduled\n    isOverdue\n    scheduledStart\n    scheduledEnd\n    completedAt\n    activityType {\n      id\n      name\n      color\n    }\n  }\n"): (typeof documents)["\n  fragment TimeBlock_CalendarView on TimeBlock {\n    id\n    daysOfWeek\n    startTime\n    endTime\n    activityType {\n      id\n      name\n      color\n    }\n  }\n\n  fragment ScheduledItem_CalendarView on ScheduledItem {\n    kind\n    id\n    title\n    isScheduled\n    isOverdue\n    scheduledStart\n    scheduledEnd\n    completedAt\n    activityType {\n      id\n      name\n      color\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PinTodo($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) { id scheduledAt manuallyScheduled }\n  }\n"): (typeof documents)["\n  mutation PinTodo($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) { id scheduledAt manuallyScheduled }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteHabitFromCalendar($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) { __typename id completedAt }\n  }\n"): (typeof documents)["\n  mutation CompleteHabitFromCalendar($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) { __typename id completedAt }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteTodoFromCalendar($id: ID!) {\n    myCompleteTodo(id: $id) { __typename id completedAt }\n  }\n"): (typeof documents)["\n  mutation CompleteTodoFromCalendar($id: ID!) {\n    myCompleteTodo(id: $id) { __typename id completedAt }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ScheduledItem_ScheduleView on ScheduledItem {\n    kind\n    id\n    title\n    priority\n    estimatedLength\n    isScheduled\n    scheduledStart\n    scheduledEnd\n    activityType {\n      id\n      name\n      color\n    }\n  }\n"): (typeof documents)["\n  fragment ScheduledItem_ScheduleView on ScheduledItem {\n    kind\n    id\n    title\n    priority\n    estimatedLength\n    isScheduled\n    scheduledStart\n    scheduledEnd\n    activityType {\n      id\n      name\n      color\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteHabitFromSchedule($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) {\n      __typename\n      id\n      completedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CompleteHabitFromSchedule($input: CompleteHabitArgs!) {\n    myCompleteHabit(input: $input) {\n      __typename\n      id\n      completedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteTodoFromSchedule($id: ID!) {\n    myCompleteTodo(id: $id) {\n      __typename\n      id\n      completedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CompleteTodoFromSchedule($id: ID!) {\n    myCompleteTodo(id: $id) {\n      __typename\n      id\n      completedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetHabitDetail($habitId: ID!, $periods: Int) {\n    myHabitDetail(habitId: $habitId, periods: $periods) {\n      habitId\n      title\n      description\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      totalCompletions\n      allTimeRate\n      activityType {\n        id\n        name\n        color\n      }\n      periods {\n        label\n        periodStart\n        periodEnd\n        completions\n        target\n        rate\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetHabitDetail($habitId: ID!, $periods: Int) {\n    myHabitDetail(habitId: $habitId, periods: $periods) {\n      habitId\n      title\n      description\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      totalCompletions\n      allTimeRate\n      activityType {\n        id\n        name\n        color\n      }\n      periods {\n        label\n        periodStart\n        periodEnd\n        completions\n        target\n        rate\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateHabit($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      id\n      title\n      description\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      pomodoroEnabled\n      pomodoroUnitLength\n      pomodoroShortBreakLength\n      pomodoroUnitsBeforeLongBreak\n      pomodoroLongBreakLength\n    }\n  }\n"): (typeof documents)["\n  mutation CreateHabit($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      id\n      title\n      description\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      pomodoroEnabled\n      pomodoroUnitLength\n      pomodoroShortBreakLength\n      pomodoroUnitsBeforeLongBreak\n      pomodoroLongBreakLength\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateHabit($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      id\n      title\n      description\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      pomodoroEnabled\n      pomodoroUnitLength\n      pomodoroShortBreakLength\n      pomodoroUnitsBeforeLongBreak\n      pomodoroLongBreakLength\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateHabit($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      id\n      title\n      description\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      frequencyCount\n      frequencyUnit\n      pomodoroEnabled\n      pomodoroUnitLength\n      pomodoroShortBreakLength\n      pomodoroUnitsBeforeLongBreak\n      pomodoroLongBreakLength\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateHabitEstimatedLength($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      id\n      estimatedLength\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateHabitEstimatedLength($input: UpdateHabitArgs!) {\n    myUpdateHabit(input: $input) {\n      id\n      estimatedLength\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment Habit_HabitList on Habit {\n    id\n    title\n    description\n    priority\n    estimatedLength\n    activityType {\n      id\n      name\n      color\n    }\n    frequencyCount\n    frequencyUnit\n    minTimeBetweenInstances\n    pomodoroEnabled\n    pomodoroUnitLength\n    pomodoroShortBreakLength\n    pomodoroUnitsBeforeLongBreak\n    pomodoroLongBreakLength\n    createdAt\n  }\n"): (typeof documents)["\n  fragment Habit_HabitList on Habit {\n    id\n    title\n    description\n    priority\n    estimatedLength\n    activityType {\n      id\n      name\n      color\n    }\n    frequencyCount\n    frequencyUnit\n    minTimeBetweenInstances\n    pomodoroEnabled\n    pomodoroUnitLength\n    pomodoroShortBreakLength\n    pomodoroUnitsBeforeLongBreak\n    pomodoroLongBreakLength\n    createdAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetActivityTypesForOnboarding {\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n"): (typeof documents)["\n  query GetActivityTypesForOnboarding {\n    myActivityTypes {\n      id\n      name\n      color\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateActivityTypeOnboarding($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n"): (typeof documents)["\n  mutation CreateActivityTypeOnboarding($input: CreateActivityTypeArgs!) {\n    myCreateActivityType(input: $input) {\n      id\n      name\n      color\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyHabitsForOnboarding {\n    myHabits {\n      id\n      title\n      frequencyCount\n      frequencyUnit\n      activityType { id name color }\n    }\n  }\n"): (typeof documents)["\n  query GetMyHabitsForOnboarding {\n    myHabits {\n      id\n      title\n      frequencyCount\n      frequencyUnit\n      activityType { id name color }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateHabitOnboarding($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      id\n      title\n    }\n  }\n"): (typeof documents)["\n  mutation CreateHabitOnboarding($input: CreateHabitArgs!) {\n    myCreateHabit(input: $input) {\n      id\n      title\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyTimeblocksForOnboarding {\n    myTimeBlocks {\n      id\n      activityType { id name color }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n"): (typeof documents)["\n  query GetMyTimeblocksForOnboarding {\n    myTimeBlocks {\n      id\n      activityType { id name color }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTimeBlockOnboarding($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      id\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTimeBlockOnboarding($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      id\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyTodosForOnboarding {\n    myTodos {\n      id\n      title\n      priority\n      list { id name }\n      activityType { id name color }\n    }\n  }\n"): (typeof documents)["\n  query GetMyTodosForOnboarding {\n    myTodos {\n      id\n      title\n      priority\n      list { id name }\n      activityType { id name color }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTodoOnboarding($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTodoOnboarding($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyApiKeys {\n    myApiKeys {\n      id\n      name\n      keyPrefix\n      scopes\n      lastUsedAt\n      expiresAt\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query MyApiKeys {\n    myApiKeys {\n      id\n      name\n      keyPrefix\n      scopes\n      lastUsedAt\n      expiresAt\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MyRevokeApiKey($id: ID!) {\n    myRevokeApiKey(id: $id)\n  }\n"): (typeof documents)["\n  mutation MyRevokeApiKey($id: ID!) {\n    myRevokeApiKey(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MyCreateApiKey($input: MyCreateApiKeyInput!) {\n    myCreateApiKey(input: $input) {\n      apiKey {\n        id\n        name\n        keyPrefix\n        scopes\n        createdAt\n      }\n      token\n    }\n  }\n"): (typeof documents)["\n  mutation MyCreateApiKey($input: MyCreateApiKeyInput!) {\n    myCreateApiKey(input: $input) {\n      apiKey {\n        id\n        name\n        keyPrefix\n        scopes\n        createdAt\n      }\n      token\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTimeBlock($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      id\n      activityType {\n        id\n        name\n        color\n      }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTimeBlock($input: CreateTimeBlockArgs!) {\n    myCreateTimeBlock(input: $input) {\n      id\n      activityType {\n        id\n        name\n        color\n      }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTimeBlock($input: UpdateTimeBlockArgs!) {\n    myUpdateTimeBlock(input: $input) {\n      id\n      activityType {\n        id\n        name\n        color\n      }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTimeBlock($input: UpdateTimeBlockArgs!) {\n    myUpdateTimeBlock(input: $input) {\n      id\n      activityType {\n        id\n        name\n        color\n      }\n      daysOfWeek\n      startTime\n      endTime\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TimeBlock_TimeBlockList on TimeBlock {\n    id\n    activityType {\n      id\n      name\n      color\n    }\n    daysOfWeek\n    startTime\n    endTime\n    priority\n    createdAt\n  }\n"): (typeof documents)["\n  fragment TimeBlock_TimeBlockList on TimeBlock {\n    id\n    activityType {\n      id\n      name\n      color\n    }\n    daysOfWeek\n    startTime\n    endTime\n    priority\n    createdAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation QuickCreateTodo($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n    }\n  }\n"): (typeof documents)["\n  mutation QuickCreateTodo($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTodoList($input: CreateTodoListArgs!) {\n    myCreateTodoList(input: $input) {\n      id\n      name\n      description\n      defaultPriority\n      defaultEstimatedLength\n      activityType { id name color }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTodoList($input: CreateTodoListArgs!) {\n    myCreateTodoList(input: $input) {\n      id\n      name\n      description\n      defaultPriority\n      defaultEstimatedLength\n      activityType { id name color }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTodoList($input: UpdateTodoListArgs!) {\n    myUpdateTodoList(input: $input) {\n      id\n      name\n      description\n      defaultPriority\n      defaultEstimatedLength\n      activityType { id name color }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTodoList($input: UpdateTodoListArgs!) {\n    myUpdateTodoList(input: $input) {\n      id\n      name\n      description\n      defaultPriority\n      defaultEstimatedLength\n      activityType { id name color }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTodoList($id: ID!) {\n    myDeleteTodoList(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTodoList($id: ID!) {\n    myDeleteTodoList(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TodoList_TodoListList on TodoList {\n    id\n    name\n    description\n    defaultPriority\n    defaultEstimatedLength\n    activityType {\n      id\n      name\n      color\n    }\n  }\n"): (typeof documents)["\n  fragment TodoList_TodoListList on TodoList {\n    id\n    name\n    description\n    defaultPriority\n    defaultEstimatedLength\n    activityType {\n      id\n      name\n      color\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTodoListsForSelect {\n    myTodoLists {\n      id\n      name\n      defaultPriority\n      defaultEstimatedLength\n      activityType {\n        id\n        name\n        color\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTodoListsForSelect {\n    myTodoLists {\n      id\n      name\n      defaultPriority\n      defaultEstimatedLength\n      activityType {\n        id\n        name\n        color\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTodo($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n      description\n      list { id name }\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      dueAt\n      scheduledAt\n      completedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTodo($input: CreateTodoArgs!) {\n    myCreateTodo(input: $input) {\n      id\n      title\n      description\n      list { id name }\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      dueAt\n      scheduledAt\n      completedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTodo($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) {\n      id\n      title\n      description\n      list { id name }\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      dueAt\n      scheduledAt\n      completedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTodo($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) {\n      id\n      title\n      description\n      list { id name }\n      activityType {\n        id\n        name\n        color\n      }\n      priority\n      estimatedLength\n      dueAt\n      scheduledAt\n      completedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteTodoFromForm($id: ID!) {\n    myCompleteTodo(id: $id) {\n      id\n      completedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CompleteTodoFromForm($id: ID!) {\n    myCompleteTodo(id: $id) {\n      id\n      completedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment Todo_TodoList on Todo {\n    id\n    title\n    description\n    priority\n    estimatedLength\n    list {\n      id\n      name\n    }\n    activityType {\n      id\n      name\n      color\n    }\n    dueAt\n    scheduledAt\n    completedAt\n    createdAt\n  }\n"): (typeof documents)["\n  fragment Todo_TodoList on Todo {\n    id\n    title\n    description\n    priority\n    estimatedLength\n    list {\n      id\n      name\n    }\n    activityType {\n      id\n      name\n      color\n    }\n    dueAt\n    scheduledAt\n    completedAt\n    createdAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTodoEstimatedLength($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) {\n      id\n      estimatedLength\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTodoEstimatedLength($input: UpdateTodoArgs!) {\n    myUpdateTodo(input: $input) {\n      id\n      estimatedLength\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UncompleteTodo($id: ID!) {\n    myUpdateTodo(input: { id: $id, completedAt: null }) {\n      id\n      completedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UncompleteTodo($id: ID!) {\n    myUpdateTodo(input: { id: $id, completedAt: null }) {\n      id\n      completedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTodo($id: ID!) {\n    myDeleteTodo(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTodo($id: ID!) {\n    myDeleteTodo(id: $id)\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;