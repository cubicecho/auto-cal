import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.ts';

/**
 * A browser's Web Push endpoint, as returned by `PushManager.subscribe`. One
 * row per device/browser; a user with a phone and a laptop has two.
 *
 * `endpoint` is unique because it is the browser's own identifier for the
 * subscription — re-registering the same browser must update the row, not add
 * a second one that would double every notification.
 *
 * `p256dh` and `auth` are the client's public key and shared secret. They are
 * write-only as far as GraphQL is concerned: the table is UNEXPOSED and the
 * columns are excluded, so nothing reads them back out over the API.
 */
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  /** Set when the push service rejects the endpoint as gone (404/410). */
  expiredAt: timestamp('expired_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
