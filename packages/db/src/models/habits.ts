import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { activityTypes } from './activity_types.ts';
import type { FrequencyUnit } from './enums.ts';
import { users } from './users.ts';

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: integer('priority').notNull().default(0),
  estimatedLength: integer('estimated_length').notNull(),
  activityTypeId: uuid('activity_type_id')
    .notNull()
    .references(() => activityTypes.id, { onDelete: 'restrict' }),
  frequencyCount: integer('frequency_count').notNull(),
  frequencyUnit: text('frequency_unit').notNull().$type<FrequencyUnit>(),
  minTimeBetweenInstances: integer('min_time_between_instances'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
