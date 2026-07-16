import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { activityTypes } from './activity_types.ts';
import { projects } from './projects.ts';
import { users } from './users.ts';

export const todoLists = pgTable('todo_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  activityTypeId: uuid('activity_type_id')
    .notNull()
    .references(() => activityTypes.id, { onDelete: 'restrict' }),
  // Nullable: a list may belong to a project or stand alone.
  projectId: uuid('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  defaultPriority: integer('default_priority').notNull().default(0),
  defaultEstimatedLength: integer('default_estimated_length')
    .notNull()
    .default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type TodoList = typeof todoLists.$inferSelect;
export type NewTodoList = typeof todoLists.$inferInsert;
