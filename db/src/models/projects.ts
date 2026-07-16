import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { activityTypes } from './activity_types.ts';
import type { ProjectStatus } from './enums.ts';
import { users } from './users.ts';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: text('status').notNull().default('active').$type<ProjectStatus>(),
  // The project's dedicated activity type (a child of a parent type). Restrict
  // delete so a project never dangles without its type.
  activityTypeId: uuid('activity_type_id')
    .notNull()
    .references(() => activityTypes.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
