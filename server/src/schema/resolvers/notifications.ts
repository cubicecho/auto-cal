import {
  notificationPreferences,
  pushSubscriptions,
} from '@auto-cal/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireUser } from '../../errors.ts';
import { pushConfigured } from '../../services/notifications.ts';
import {
  RegisterPushSubscriptionInput,
  UpdateNotificationPreferencesInput,
} from '../validators.ts';
import type { MutationMap, QueryMap } from './types.ts';

/**
 * Read the caller's preferences, creating the row on first read.
 *
 * The generated `notificationPreference` query would serve this, but it
 * returns null before the user has ever saved anything — which would put a
 * "null means the defaults" branch in every caller. Materialising the row
 * instead means the client always has concrete values to render, and the
 * defaults live in one place (the column definitions).
 */
export const notificationQueries: QueryMap<
  'myNotificationPreferences' | 'myPushPublicKey'
> = {
  myNotificationPreferences: async (_parent, _args, context) => {
    const userId = requireUser(context);
    const existing = await context.db.query.notificationPreferences.findFirst({
      where: { userId },
    });
    if (existing) return existing;
    const [created] = await context.db
      .insert(notificationPreferences)
      .values({ userId })
      // Two tabs opening the settings at once both insert; the unique
      // constraint on `userId` makes the loser a no-op rather than an error.
      .onConflictDoNothing()
      .returning();
    if (created) return created;
    const row = await context.db.query.notificationPreferences.findFirst({
      where: { userId },
    });
    if (!row) throw new Error('Failed to create notification preferences');
    return row;
  },

  /**
   * The VAPID public key the browser needs to subscribe. Null when the server
   * has no keys configured, which is how the client knows to hide the whole
   * notifications section rather than offering a button that cannot work.
   */
  myPushPublicKey: (_parent, _args, context) => {
    requireUser(context);
    return pushConfigured() ? (process.env.VAPID_PUBLIC_KEY ?? null) : null;
  },
};

export const notificationMutations: MutationMap<
  | 'myUpdateNotificationPreferences'
  | 'myRegisterPushSubscription'
  | 'myUnregisterPushSubscription'
> = {
  myUpdateNotificationPreferences: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = UpdateNotificationPreferencesInput.parse(args.input);

    // Only what the caller actually sent: an omitted field keeps its stored
    // value rather than reverting to the column default.
    const patch = {
      ...(input.enabled !== undefined && { enabled: input.enabled }),
      ...(input.leadTimeMinutes !== undefined && {
        leadTimeMinutes: input.leadTimeMinutes,
      }),
      ...(input.quietHoursStart !== undefined && {
        quietHoursStart: input.quietHoursStart,
      }),
      ...(input.quietHoursEnd !== undefined && {
        quietHoursEnd: input.quietHoursEnd,
      }),
      ...(input.activityTypeIds !== undefined && {
        activityTypeIds: input.activityTypeIds,
      }),
      ...(input.habitDigest !== undefined && {
        habitDigest: input.habitDigest,
      }),
      updatedAt: new Date(),
    };

    const [row] = await context.db
      .insert(notificationPreferences)
      .values({ userId, ...patch })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: patch,
      })
      .returning();
    if (!row) throw new Error('Failed to save notification preferences');
    return row;
  },

  /**
   * Store a browser's push endpoint. Upserts on `endpoint` because that is the
   * browser's own identifier for the subscription — a page reload re-subscribes
   * with the same endpoint, and a second row would double every notification.
   *
   * The upsert also rewrites `userId`, so signing in as someone else on a
   * shared browser moves the endpoint rather than leaving it pushing the
   * previous user's schedule.
   */
  myRegisterPushSubscription: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = RegisterPushSubscriptionInput.parse(args.input);
    await context.db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent ?? null,
          expiredAt: null,
        },
      });
    return true;
  },

  myUnregisterPushSubscription: async (_parent, args, context) => {
    const userId = requireUser(context);
    // Scoped by userId as well as endpoint: an endpoint is unguessable, but a
    // delete is still not something one account should be able to do to
    // another's row.
    await context.db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, args.endpoint),
        ),
      );
    return true;
  },
};
