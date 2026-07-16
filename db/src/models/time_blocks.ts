import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { activityTypes } from './activity_types.ts';
import { users } from './users.ts';

export const timeBlocks = pgTable('time_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  activityTypeId: uuid('activity_type_id')
    .notNull()
    .references(() => activityTypes.id, { onDelete: 'restrict' }),
  daysOfWeek: integer('days_of_week').array().notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  priority: integer('priority').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type TimeBlock = typeof timeBlocks.$inferSelect;
export type NewTimeBlock = typeof timeBlocks.$inferInsert;
