import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.ts';

// User-created one-off calendar events. They render on the calendar and block
// the scheduler from placing todos/habits over their time (see computeSchedule).
export const manualEvents = pgTable('manual_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  color: text('color'),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ManualEvent = typeof manualEvents.$inferSelect;
export type NewManualEvent = typeof manualEvents.$inferInsert;
