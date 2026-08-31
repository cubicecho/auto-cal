import type { DB } from '@auto-cal/db';
import { pushSubscriptions, sentNotifications } from '@auto-cal/db/schema';
import { formatInTimeZone } from 'date-fns-tz';
import { eq } from 'drizzle-orm';
import webpush from 'web-push';
import { log } from '../logger.ts';

/**
 * Web Push notifications for slots that are about to start.
 *
 * The moving parts are deliberately split: everything that decides *what*
 * should go out is a pure function over rows and a clock, and only
 * {@link runNotificationTick} touches the database or the network. That is what
 * makes quiet hours and the lead-time window testable without a push service.
 */

/** Defaults for a user who has never opened the notification settings. */
export const DEFAULT_PREFERENCES = {
  enabled: true,
  leadTimeMinutes: 10,
  quietHoursStart: null as string | null,
  quietHoursEnd: null as string | null,
  activityTypeIds: [] as string[],
  habitDigest: true,
};

export type NotificationPrefs = typeof DEFAULT_PREFERENCES;

/** One notification the tick has decided to send. */
export type DueNotification = {
  userId: string;
  /** `todos.id`, or a habit instance's `<habitId>-<index>`. */
  itemKey: string;
  scheduledFor: Date;
  title: string;
  body: string;
  /** Where clicking the notification lands. */
  url: string;
};

/**
 * True when `at` falls inside the user's quiet hours.
 *
 * `start` and `end` are local "HH:MM" and the window is allowed to wrap
 * midnight — 22:00→07:00 is the common case, and it is the one a naive
 * `start <= t < end` gets wrong, so the wrapping window is checked as the
 * union of its two halves instead.
 */
export function withinQuietHours(
  localHHMM: string,
  start: string | null,
  end: string | null,
): boolean {
  if (!start || !end) return false;
  if (start === end) return false;
  return start < end
    ? localHHMM >= start && localHHMM < end
    : localHHMM >= start || localHHMM < end;
}

/** Local "HH:MM" for `at` in `timezone`, falling back to UTC on a bad zone. */
export function localTimeOfDay(at: Date, timezone: string): string {
  try {
    return formatInTimeZone(at, timezone, 'HH:mm');
  } catch {
    return formatInTimeZone(at, 'UTC', 'HH:mm');
  }
}

/**
 * The slice of the future a tick is responsible for: everything starting
 * between the lead time from now and the lead time from the *previous* tick.
 *
 * The window is open at the near end rather than being a single instant so a
 * tick that runs late, or a slot that lands between two ticks, is still caught
 * — `sent_notifications` is what keeps that from sending twice.
 */
export function notificationWindow(
  now: Date,
  leadTimeMinutes: number,
  tickSeconds: number,
): { from: Date; to: Date } {
  const to = new Date(now.getTime() + leadTimeMinutes * 60_000);
  const from = new Date(to.getTime() - tickSeconds * 1000);
  return { from, to };
}

/** How long a notification is worth sending after its slot has passed. */
const STALE_AFTER_MS = 15 * 60_000;

export function isStale(scheduledFor: Date, now: Date): boolean {
  return scheduledFor.getTime() < now.getTime() - STALE_AFTER_MS;
}

/** Human "in 10 minutes" / "now" for the notification body. */
export function leadPhrase(scheduledFor: Date, now: Date): string {
  const minutes = Math.round((scheduledFor.getTime() - now.getTime()) / 60_000);
  if (minutes <= 0) return 'starting now';
  if (minutes === 1) return 'starting in a minute';
  return `starting in ${minutes} minutes`;
}

/** Whether the VAPID keys needed to sign a push are configured. */
export function pushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

let vapidConfigured = false;

function configureVapid(): void {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY ?? '',
    process.env.VAPID_PRIVATE_KEY ?? '',
  );
  vapidConfigured = true;
}

/**
 * Load a user's preferences, or the defaults if they have never saved any.
 * Absence means "the defaults", not "off" — see the table comment.
 */
export async function loadPreferences(
  db: DB,
  userId: string,
): Promise<NotificationPrefs> {
  const row = await db.query.notificationPreferences.findFirst({
    where: { userId },
  });
  if (!row) return { ...DEFAULT_PREFERENCES };
  return {
    enabled: row.enabled,
    leadTimeMinutes: row.leadTimeMinutes,
    quietHoursStart: row.quietHoursStart,
    quietHoursEnd: row.quietHoursEnd,
    activityTypeIds: row.activityTypeIds,
    habitDigest: row.habitDigest,
  };
}

/**
 * The todos and habit instances starting inside `user`'s window.
 *
 * Habit instances are the tentative `habit_completions` rows the scheduler
 * writes — a skipped one is not a slot the user intends to keep, so it is
 * excluded here as it is everywhere else.
 */
async function findDueForUser(
  db: DB,
  userId: string,
  prefs: NotificationPrefs,
  now: Date,
  tickSeconds: number,
): Promise<DueNotification[]> {
  const { from, to } = notificationWindow(
    now,
    prefs.leadTimeMinutes,
    tickSeconds,
  );
  const opted = new Set(prefs.activityTypeIds);
  const wanted = (activityTypeId: string | null | undefined) =>
    opted.size === 0 || (!!activityTypeId && opted.has(activityTypeId));

  const [dueTodos, dueHabits] = await Promise.all([
    db.query.todos.findMany({
      where: {
        userId,
        completedAt: { isNull: true },
        scheduledAt: { gte: from, lte: to },
      },
      with: { list: true },
    }),
    db.query.habitCompletions.findMany({
      where: {
        habit: { userId },
        skipped: false,
        completedAt: { isNull: true },
        scheduledAt: { gte: from, lte: to },
      },
      with: { habit: true },
    }),
  ]);

  const due: DueNotification[] = [];

  for (const todo of dueTodos) {
    if (!todo.scheduledAt) continue;
    if (!wanted(todo.list?.activityTypeId)) continue;
    due.push({
      userId,
      itemKey: todo.id,
      scheduledFor: todo.scheduledAt,
      title: todo.title,
      body: `${leadPhrase(todo.scheduledAt, now)} · ${todo.estimatedLength} min`,
      url: '/today',
    });
  }

  for (const instance of dueHabits) {
    if (!instance.scheduledAt || !instance.habit) continue;
    if (!wanted(instance.habit.activityTypeId)) continue;
    due.push({
      userId,
      // The completion row's own id: one notification per placed instance,
      // and a re-placed instance is a new row, so it notifies again.
      itemKey: instance.id,
      scheduledFor: instance.scheduledAt,
      title: instance.habit.title,
      body: `${leadPhrase(instance.scheduledAt, now)} · ${instance.habit.estimatedLength} min`,
      url: '/today',
    });
  }

  return due.filter((n) => !isStale(n.scheduledFor, now));
}

/**
 * Claim the notifications not already sent.
 *
 * The unique constraint on `sent_notifications` is the idempotency key: the
 * insert is `onConflictDoNothing().returning()`, so what comes back is exactly
 * the rows this call won. Two overlapping ticks therefore cannot both send the
 * same notification, and a tick that runs every minute over a window several
 * minutes wide sends each slot once.
 */
async function claimUnsent(
  db: DB,
  due: DueNotification[],
): Promise<DueNotification[]> {
  if (due.length === 0) return [];
  const claimed = await db
    .insert(sentNotifications)
    .values(
      due.map((n) => ({
        userId: n.userId,
        itemKey: n.itemKey,
        scheduledFor: n.scheduledFor,
      })),
    )
    .onConflictDoNothing()
    .returning();
  const won = new Set(
    claimed.map(
      (row: { itemKey: string; scheduledFor: Date }) =>
        `${row.itemKey}@${row.scheduledFor.toISOString()}`,
    ),
  );
  return due.filter((n) =>
    won.has(`${n.itemKey}@${n.scheduledFor.toISOString()}`),
  );
}

/** Push one notification to every live subscription the user has. */
async function deliver(
  db: DB,
  notification: DueNotification,
  subscriptions: Array<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }>,
): Promise<void> {
  configureVapid();
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url,
    tag: notification.itemKey,
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410 is the push service saying the browser is gone for good.
        // Anything else (a timeout, a 5xx) is transient — leave the row alone
        // so the next tick tries again.
        if (status === 404 || status === 410) {
          await db
            .update(pushSubscriptions)
            .set({ expiredAt: new Date() })
            .where(eq(pushSubscriptions.id, sub.id));
          log.debug('[notifications] dropped expired subscription', sub.id);
        } else {
          log.warn('[notifications] push failed', status, err);
        }
      }
    }),
  );
}

/**
 * One pass: for every user with a live push subscription, send what is due.
 *
 * Driven from the subscriptions rather than from the users table because a
 * user with no browser registered has nowhere for a notification to go, and
 * the tick should cost nothing for them.
 */
export async function runNotificationTick(
  db: DB,
  tickSeconds: number,
  now: Date = new Date(),
): Promise<number> {
  const live = await db.query.pushSubscriptions.findMany({
    where: { expiredAt: { isNull: true } },
    with: { user: true },
  });
  if (live.length === 0) return 0;

  const byUser = new Map<string, typeof live>();
  for (const sub of live) {
    const existing = byUser.get(sub.userId) ?? [];
    existing.push(sub);
    byUser.set(sub.userId, existing);
  }

  let sent = 0;
  for (const [userId, subs] of byUser) {
    try {
      const prefs = await loadPreferences(db, userId);
      if (!prefs.enabled) continue;

      const timezone = subs[0]?.user?.timezone ?? 'UTC';
      if (
        withinQuietHours(
          localTimeOfDay(now, timezone),
          prefs.quietHoursStart,
          prefs.quietHoursEnd,
        )
      ) {
        continue;
      }

      const due = await findDueForUser(db, userId, prefs, now, tickSeconds);
      const toSend = await claimUnsent(db, due);
      for (const notification of toSend) {
        await deliver(db, notification, subs);
        sent += 1;
      }
    } catch (err) {
      // One user's failure must not stop the tick for everyone else.
      log.error('[notifications] tick failed for user', userId, err);
    }
  }
  return sent;
}

/**
 * Start the tick. Returns a stop function, or null when push is not configured
 * — a deploy without VAPID keys runs normally and simply never notifies, which
 * is why this logs rather than throwing.
 */
export function startNotificationTick(db: DB): (() => void) | null {
  if (!pushConfigured()) {
    log.info(
      '[notifications] VAPID keys not set — push notifications are disabled',
    );
    return null;
  }
  const tickSeconds = Number(process.env.NOTIFICATION_TICK_SECONDS ?? 60);
  const timer = setInterval(() => {
    runNotificationTick(db, tickSeconds).catch((err) =>
      log.error('[notifications] tick failed', err),
    );
  }, tickSeconds * 1000);
  // Never hold the process open on the tick alone.
  timer.unref();
  log.info(`[notifications] push tick every ${tickSeconds}s`);
  return () => clearInterval(timer);
}
