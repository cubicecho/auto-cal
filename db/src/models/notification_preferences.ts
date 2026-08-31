import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.ts';

/**
 * One row per user, created lazily the first time preferences are read or
 * written. Absence therefore means "the defaults", not "notifications off" —
 * `enabled` is what turns them off, and it defaults to true so a user who
 * grants the browser permission starts receiving them.
 */
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(true),
  /** How far ahead of `scheduledAt` the push goes out. */
  leadTimeMinutes: integer('lead_time_minutes').notNull().default(10),
  /**
   * Local "HH:MM" bounds, interpreted in `users.timezone`. A window that wraps
   * midnight (22:00 → 07:00) is the normal case, so the check is not a simple
   * `start <= now < end` — see `withinQuietHours` in the notifications service.
   * Both null means no quiet hours.
   */
  quietHoursStart: text('quiet_hours_start'),
  quietHoursEnd: text('quiet_hours_end'),
  /**
   * Activity types opted in. Empty means every type — an explicit opt-in list
   * that starts empty would silently notify about nothing.
   */
  activityTypeIds: uuid('activity_type_ids').array().notNull().default([]),
  /** The "habits due today" summary on first load of the day. */
  habitDigest: boolean('habit_digest').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type NotificationPreference =
  typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference =
  typeof notificationPreferences.$inferInsert;
