/**
 * The notification tick. The pure decision functions are tested directly; the
 * tick itself runs against PGLite with `web-push` mocked, which is what
 * actually exercises the window query, the idempotency claim, and the expiry
 * of a dead subscription.
 */
import {
  habitCompletions,
  notificationPreferences,
  pushSubscriptions,
} from '@auto-cal/db/schema';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const sendNotification = vi.hoisted(() => vi.fn());
vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification },
}));

import {
  DEFAULT_PREFERENCES,
  isStale,
  leadPhrase,
  localTimeOfDay,
  notificationWindow,
  runNotificationTick,
  withinQuietHours,
} from '../../src/services/notifications.ts';
import {
  type TestDb,
  createTestDb,
  seedActivityType,
  seedHabit,
  seedTodo,
  seedTodoList,
  seedUser,
} from '../schema/resolvers/test-helpers.ts';

const TICK_SECONDS = 60;

describe('withinQuietHours', () => {
  it('is false when either bound is unset', () => {
    expect(withinQuietHours('03:00', null, '07:00')).toBe(false);
    expect(withinQuietHours('03:00', '22:00', null)).toBe(false);
  });

  it('handles a window inside one day', () => {
    expect(withinQuietHours('13:30', '12:00', '14:00')).toBe(true);
    expect(withinQuietHours('11:59', '12:00', '14:00')).toBe(false);
    // The end is exclusive, so a slot at exactly the end time is notifiable.
    expect(withinQuietHours('14:00', '12:00', '14:00')).toBe(false);
  });

  it('handles a window that wraps midnight', () => {
    expect(withinQuietHours('23:30', '22:00', '07:00')).toBe(true);
    expect(withinQuietHours('03:00', '22:00', '07:00')).toBe(true);
    expect(withinQuietHours('12:00', '22:00', '07:00')).toBe(false);
    expect(withinQuietHours('07:00', '22:00', '07:00')).toBe(false);
  });

  it('treats an empty window as no quiet hours rather than all day', () => {
    expect(withinQuietHours('12:00', '22:00', '22:00')).toBe(false);
  });
});

describe('localTimeOfDay', () => {
  it('renders the local wall clock, not UTC', () => {
    const at = new Date('2026-03-01T02:30:00Z');
    expect(localTimeOfDay(at, 'UTC')).toBe('02:30');
    expect(localTimeOfDay(at, 'America/New_York')).toBe('21:30');
  });

  it('falls back to UTC for a timezone the runtime does not know', () => {
    const at = new Date('2026-03-01T02:30:00Z');
    expect(localTimeOfDay(at, 'Mars/Olympus_Mons')).toBe('02:30');
  });
});

describe('notificationWindow', () => {
  it('ends at the lead time and reaches back one tick', () => {
    const now = new Date('2026-03-01T12:00:00Z');
    const { from, to } = notificationWindow(now, 10, 60);
    expect(to.toISOString()).toBe('2026-03-01T12:10:00.000Z');
    expect(from.toISOString()).toBe('2026-03-01T12:09:00.000Z');
  });
});

describe('isStale', () => {
  const now = new Date('2026-03-01T12:00:00Z');

  it('keeps a slot that has only just passed', () => {
    expect(isStale(new Date('2026-03-01T11:50:00Z'), now)).toBe(false);
  });

  it('drops one from long enough ago that it is noise', () => {
    expect(isStale(new Date('2026-03-01T11:40:00Z'), now)).toBe(true);
  });
});

describe('leadPhrase', () => {
  const now = new Date('2026-03-01T12:00:00Z');

  it('counts the minutes remaining', () => {
    expect(leadPhrase(new Date('2026-03-01T12:10:00Z'), now)).toBe(
      'starting in 10 minutes',
    );
    expect(leadPhrase(new Date('2026-03-01T12:01:00Z'), now)).toBe(
      'starting in a minute',
    );
  });

  it('says "now" once the slot has arrived', () => {
    expect(leadPhrase(now, now)).toBe('starting now');
    expect(leadPhrase(new Date('2026-03-01T11:58:00Z'), now)).toBe(
      'starting now',
    );
  });
});

describe('runNotificationTick', () => {
  let db: TestDb;

  beforeAll(async () => {
    db = await createTestDb();
  }, 30000);

  beforeEach(() => {
    sendNotification.mockReset();
    sendNotification.mockResolvedValue({ statusCode: 201 });
  });

  async function seedSubscription(
    db: TestDb,
    userId: string,
    endpoint: string,
  ) {
    const [sub] = await db
      .insert(pushSubscriptions)
      .values({ userId, endpoint, p256dh: 'p256dh-key', auth: 'auth-key' })
      .returning();
    if (!sub) throw new Error('Failed to create push subscription');
    return sub;
  }

  /** A user with a browser registered and one todo due in ten minutes. */
  async function seedDueTodo(email: string, now: Date) {
    const { id: userId } = await seedUser(db, email);
    const at = await seedActivityType(db, userId);
    const list = await seedTodoList(db, userId, at.id);
    const todo = await seedTodo(db, userId, list.id, {
      title: 'Write the thing',
      scheduledAt: new Date(now.getTime() + 10 * 60_000),
    });
    await seedSubscription(db, userId, `https://push.example/${email}`);
    return { userId, todo, activityTypeId: at.id };
  }

  it('does nothing when nobody has a live subscription', async () => {
    const sent = await runNotificationTick(db, TICK_SECONDS, new Date());
    expect(sent).toBe(0);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('pushes a todo starting one lead time from now', async () => {
    const now = new Date();
    const { todo } = await seedDueTodo('notify-todo@example.com', now);

    const sent = await runNotificationTick(db, TICK_SECONDS, now);

    expect(sent).toBe(1);
    expect(sendNotification).toHaveBeenCalledTimes(1);
    const [subscription, payload] = sendNotification.mock.calls[0] ?? [];
    expect(subscription).toMatchObject({
      endpoint: 'https://push.example/notify-todo@example.com',
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    });
    const body = JSON.parse(payload as string);
    expect(body.title).toBe('Write the thing');
    expect(body.body).toContain('starting in 10 minutes');
    expect(body.tag).toBe(todo.id);
  });

  it('sends each slot once however often the tick runs', async () => {
    const now = new Date();
    await seedDueTodo('notify-once@example.com', now);

    await runNotificationTick(db, TICK_SECONDS, now);
    const calls = sendNotification.mock.calls.length;
    const again = await runNotificationTick(
      db,
      TICK_SECONDS,
      new Date(now.getTime() + 1000),
    );

    expect(again).toBe(0);
    expect(sendNotification.mock.calls.length).toBe(calls);
  });

  it('skips a user whose notifications are switched off', async () => {
    const now = new Date();
    const { userId } = await seedDueTodo('notify-off@example.com', now);
    await db
      .insert(notificationPreferences)
      .values({ userId, enabled: false })
      .onConflictDoNothing();

    const sent = await runNotificationTick(db, TICK_SECONDS, now);
    expect(sent).toBe(0);
  });

  it('stays quiet inside quiet hours', async () => {
    const now = new Date();
    const { userId } = await seedDueTodo('notify-quiet@example.com', now);
    // A window that covers the whole day in every timezone, so the test does
    // not depend on when it runs.
    await db
      .insert(notificationPreferences)
      .values({ userId, quietHoursStart: '00:00', quietHoursEnd: '23:59' })
      .onConflictDoNothing();

    const sent = await runNotificationTick(db, TICK_SECONDS, now);
    expect(sent).toBe(0);
  });

  it('ignores activity types the user did not opt in to', async () => {
    const now = new Date();
    const { userId } = await seedDueTodo('notify-optin@example.com', now);
    const other = await seedActivityType(db, userId, 'Something else');
    await db
      .insert(notificationPreferences)
      .values({ userId, activityTypeIds: [other.id] })
      .onConflictDoNothing();

    const sent = await runNotificationTick(db, TICK_SECONDS, now);
    expect(sent).toBe(0);
  });

  it('pushes a scheduled habit instance but not a skipped one', async () => {
    const now = new Date();
    const { id: userId } = await seedUser(db, 'notify-habit@example.com');
    const at = await seedActivityType(db, userId);
    const kept = await seedHabit(db, userId, at.id, { title: 'Meditate' });
    const declined = await seedHabit(db, userId, at.id, { title: 'Run' });
    const scheduledAt = new Date(now.getTime() + 10 * 60_000);
    await db.insert(habitCompletions).values([
      { habitId: kept.id, scheduledAt },
      { habitId: declined.id, scheduledAt, skipped: true },
    ]);
    await seedSubscription(db, userId, 'https://push.example/habit');

    const sent = await runNotificationTick(db, TICK_SECONDS, now);

    expect(sent).toBe(1);
    const titles = sendNotification.mock.calls.map(
      ([, payload]) => JSON.parse(payload as string).title,
    );
    expect(titles).toEqual(['Meditate']);
  });

  it('retires a subscription the push service says is gone', async () => {
    const now = new Date();
    const { userId } = await seedDueTodo('notify-gone@example.com', now);
    sendNotification.mockRejectedValueOnce(
      Object.assign(new Error('gone'), { statusCode: 410 }),
    );

    await runNotificationTick(db, TICK_SECONDS, now);

    const subs = await db.query.pushSubscriptions.findMany({
      where: { userId },
    });
    expect(subs[0]?.expiredAt).toBeInstanceOf(Date);
  });

  it('keeps a subscription that failed transiently', async () => {
    const now = new Date();
    const { userId } = await seedDueTodo('notify-flaky@example.com', now);
    sendNotification.mockRejectedValueOnce(
      Object.assign(new Error('service unavailable'), { statusCode: 503 }),
    );

    await runNotificationTick(db, TICK_SECONDS, now);

    const subs = await db.query.pushSubscriptions.findMany({
      where: { userId },
    });
    expect(subs[0]?.expiredAt).toBeNull();
  });
});

describe('DEFAULT_PREFERENCES', () => {
  it('notifies by default — absence means "never configured", not "off"', () => {
    expect(DEFAULT_PREFERENCES.enabled).toBe(true);
    expect(DEFAULT_PREFERENCES.leadTimeMinutes).toBe(10);
    expect(DEFAULT_PREFERENCES.activityTypeIds).toEqual([]);
  });
});
