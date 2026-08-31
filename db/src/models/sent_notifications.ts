import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.ts';

/**
 * What the tick has already sent, so a run every minute does not re-notify the
 * same slot every minute. The unique constraint is the idempotency key: the
 * tick inserts with `onConflictDoNothing` and pushes only for the rows the
 * insert actually claimed, which also makes two overlapping ticks safe.
 *
 * `itemKey` is the scheduled item's id — `todos.id`, or a habit instance's
 * `<habitId>-<index>` — and `scheduledFor` pins it to the occurrence, so
 * rescheduling the same todo to a later slot notifies again.
 */
export const sentNotifications = pgTable(
  'sent_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemKey: text('item_key').notNull(),
    scheduledFor: timestamp('scheduled_for').notNull(),
    sentAt: timestamp('sent_at').notNull().defaultNow(),
  },
  (table) => [unique().on(table.userId, table.itemKey, table.scheduledFor)],
);

export type SentNotification = typeof sentNotifications.$inferSelect;
export type NewSentNotification = typeof sentNotifications.$inferInsert;
