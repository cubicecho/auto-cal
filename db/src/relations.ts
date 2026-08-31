import { defineRelations } from 'drizzle-orm';
import * as schema from './schema.ts';

export const relations = defineRelations(schema, (r) => ({
  users: {
    activityTypes: r.many.activityTypes({
      from: r.users.id,
      to: r.activityTypes.userId,
    }),
    todoLists: r.many.todoLists({
      from: r.users.id,
      to: r.todoLists.userId,
    }),
    todos: r.many.todos({
      from: r.users.id,
      to: r.todos.userId,
    }),
    habits: r.many.habits({
      from: r.users.id,
      to: r.habits.userId,
    }),
    timeBlocks: r.many.timeBlocks({
      from: r.users.id,
      to: r.timeBlocks.userId,
    }),
    manualEvents: r.many.manualEvents({
      from: r.users.id,
      to: r.manualEvents.userId,
    }),
    apiKeys: r.many.apiKeys({
      from: r.users.id,
      to: r.apiKeys.userId,
    }),
    projects: r.many.projects({
      from: r.users.id,
      to: r.projects.userId,
    }),
    notificationPreferences: r.one.notificationPreferences({
      from: r.users.id,
      to: r.notificationPreferences.userId,
    }),
    pushSubscriptions: r.many.pushSubscriptions({
      from: r.users.id,
      to: r.pushSubscriptions.userId,
    }),
  },
  notificationPreferences: {
    user: r.one.users({
      from: r.notificationPreferences.userId,
      to: r.users.id,
    }),
  },
  pushSubscriptions: {
    user: r.one.users({
      from: r.pushSubscriptions.userId,
      to: r.users.id,
    }),
  },
  sentNotifications: {
    user: r.one.users({
      from: r.sentNotifications.userId,
      to: r.users.id,
    }),
  },
  apiKeys: {
    user: r.one.users({
      from: r.apiKeys.userId,
      to: r.users.id,
    }),
  },
  activityTypes: {
    user: r.one.users({
      from: r.activityTypes.userId,
      to: r.users.id,
    }),
    todoLists: r.many.todoLists({
      from: r.activityTypes.id,
      to: r.todoLists.activityTypeId,
    }),
    habits: r.many.habits({
      from: r.activityTypes.id,
      to: r.habits.activityTypeId,
    }),
    timeBlocks: r.many.timeBlocks({
      from: r.activityTypes.id,
      to: r.timeBlocks.activityTypeId,
    }),
  },
  projects: {
    user: r.one.users({
      from: r.projects.userId,
      to: r.users.id,
    }),
    activityType: r.one.activityTypes({
      from: r.projects.activityTypeId,
      to: r.activityTypes.id,
    }),
    notes: r.many.projectNotes({
      from: r.projects.id,
      to: r.projectNotes.projectId,
    }),
  },
  projectNotes: {
    user: r.one.users({
      from: r.projectNotes.userId,
      to: r.users.id,
    }),
    project: r.one.projects({
      from: r.projectNotes.projectId,
      to: r.projects.id,
    }),
  },
  todoLists: {
    user: r.one.users({
      from: r.todoLists.userId,
      to: r.users.id,
    }),
    activityType: r.one.activityTypes({
      from: r.todoLists.activityTypeId,
      to: r.activityTypes.id,
    }),
    project: r.one.projects({
      from: r.todoLists.projectId,
      to: r.projects.id,
    }),
    todos: r.many.todos({
      from: r.todoLists.id,
      to: r.todos.listId,
    }),
  },
  todos: {
    user: r.one.users({
      from: r.todos.userId,
      to: r.users.id,
    }),
    list: r.one.todoLists({
      from: r.todos.listId,
      to: r.todoLists.id,
    }),
  },
  habits: {
    user: r.one.users({
      from: r.habits.userId,
      to: r.users.id,
    }),
    activityType: r.one.activityTypes({
      from: r.habits.activityTypeId,
      to: r.activityTypes.id,
    }),
    completions: r.many.habitCompletions({
      from: r.habits.id,
      to: r.habitCompletions.habitId,
    }),
  },
  habitCompletions: {
    habit: r.one.habits({
      from: r.habitCompletions.habitId,
      to: r.habits.id,
    }),
  },
  timeBlocks: {
    user: r.one.users({
      from: r.timeBlocks.userId,
      to: r.users.id,
    }),
    activityType: r.one.activityTypes({
      from: r.timeBlocks.activityTypeId,
      to: r.activityTypes.id,
    }),
  },
  manualEvents: {
    user: r.one.users({
      from: r.manualEvents.userId,
      to: r.users.id,
    }),
  },
}));
