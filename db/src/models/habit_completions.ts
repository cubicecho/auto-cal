import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { habits } from './habits.ts';

export const habitCompletions = pgTable('habit_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at'), // When it was scheduled
  completedAt: timestamp('completed_at'),
  // A deliberately-missed instance: `completedAt` stays null so it never
  // counts as a completion, but the row survives the writeback's sweep of
  // tentative rows and counts toward the period's frequency, so the scheduler
  // does not simply re-place what the user just declined.
  skipped: boolean('skipped').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type NewHabitCompletion = typeof habitCompletions.$inferInsert;
