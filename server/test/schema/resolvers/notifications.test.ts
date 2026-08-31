import { pushSubscriptions } from '@auto-cal/db/schema';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedActivityType,
  seedUser,
} from './test-helpers.ts';

const PREFERENCES = `
  query {
    myNotificationPreferences {
      enabled
      leadTimeMinutes
      quietHoursStart
      quietHoursEnd
      activityTypeIds
      habitDigest
    }
  }
`;

const UPDATE = `
  mutation($input: UpdateNotificationPreferencesArgs!) {
    myUpdateNotificationPreferences(input: $input) {
      enabled
      leadTimeMinutes
      quietHoursStart
      quietHoursEnd
      activityTypeIds
      habitDigest
    }
  }
`;

const REGISTER = `
  mutation($input: RegisterPushSubscriptionArgs!) {
    myRegisterPushSubscription(input: $input)
  }
`;

type Prefs = {
  enabled: boolean;
  leadTimeMinutes: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  activityTypeIds: string[];
  habitDigest: boolean;
};

describe('notification resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  describe('myNotificationPreferences', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(testSchema, db, '', PREFERENCES);
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('materialises a row of defaults on first read', async () => {
      const { id: userId } = await seedUser(db, 'prefs-first@example.com');

      const result = await gql(testSchema, db, userId, PREFERENCES);

      expect(result.errors).toBeUndefined();
      expect(result.data?.myNotificationPreferences).toEqual({
        enabled: true,
        leadTimeMinutes: 10,
        quietHoursStart: null,
        quietHoursEnd: null,
        activityTypeIds: [],
        habitDigest: true,
      });
      const rows = await db.query.notificationPreferences.findMany({
        where: { userId },
      });
      expect(rows).toHaveLength(1);
    });

    it('does not create a second row on a second read', async () => {
      const { id: userId } = await seedUser(db, 'prefs-twice@example.com');

      await gql(testSchema, db, userId, PREFERENCES);
      await gql(testSchema, db, userId, PREFERENCES);

      const rows = await db.query.notificationPreferences.findMany({
        where: { userId },
      });
      expect(rows).toHaveLength(1);
    });
  });

  describe('myUpdateNotificationPreferences', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(testSchema, db, '', UPDATE, {
        input: { enabled: false },
      });
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('saves without a prior read', async () => {
      const { id: userId } = await seedUser(db, 'prefs-upsert@example.com');

      const result = await gql(testSchema, db, userId, UPDATE, {
        input: { leadTimeMinutes: 30 },
      });

      expect(result.errors).toBeUndefined();
      const prefs = result.data?.myUpdateNotificationPreferences as Prefs;
      expect(prefs.leadTimeMinutes).toBe(30);
      expect(prefs.enabled).toBe(true);
    });

    it('leaves omitted fields alone rather than resetting them', async () => {
      const { id: userId } = await seedUser(db, 'prefs-patch@example.com');
      await gql(testSchema, db, userId, UPDATE, {
        input: { leadTimeMinutes: 45, habitDigest: false },
      });

      const result = await gql(testSchema, db, userId, UPDATE, {
        input: { enabled: false },
      });

      const prefs = result.data?.myUpdateNotificationPreferences as Prefs;
      expect(prefs.enabled).toBe(false);
      expect(prefs.leadTimeMinutes).toBe(45);
      expect(prefs.habitDigest).toBe(false);
    });

    it('clears quiet hours when both bounds are null', async () => {
      const { id: userId } = await seedUser(db, 'prefs-quiet@example.com');
      await gql(testSchema, db, userId, UPDATE, {
        input: { quietHoursStart: '22:00', quietHoursEnd: '07:00' },
      });

      const result = await gql(testSchema, db, userId, UPDATE, {
        input: { quietHoursStart: null, quietHoursEnd: null },
      });

      const prefs = result.data?.myUpdateNotificationPreferences as Prefs;
      expect(prefs.quietHoursStart).toBeNull();
      expect(prefs.quietHoursEnd).toBeNull();
    });

    it('rejects a lead time outside the allowed range', async () => {
      const { id: userId } = await seedUser(db, 'prefs-lead@example.com');
      const result = await gql(testSchema, db, userId, UPDATE, {
        input: { leadTimeMinutes: 500 },
      });
      expect(result.errors?.[0]?.message).toBeTruthy();
    });

    it('rejects a time of day that is not HH:MM', async () => {
      const { id: userId } = await seedUser(db, 'prefs-hhmm@example.com');
      const result = await gql(testSchema, db, userId, UPDATE, {
        input: { quietHoursStart: '10pm', quietHoursEnd: '07:00' },
      });
      expect(result.errors?.[0]?.message).toMatch(/HH:MM/);
    });

    it('stores an activity-type opt-in list', async () => {
      const { id: userId } = await seedUser(db, 'prefs-types@example.com');
      const at = await seedActivityType(db, userId);

      const result = await gql(testSchema, db, userId, UPDATE, {
        input: { activityTypeIds: [at.id] },
      });

      const prefs = result.data?.myUpdateNotificationPreferences as Prefs;
      expect(prefs.activityTypeIds).toEqual([at.id]);
    });

    it("does not touch another user's preferences", async () => {
      const { id: userId } = await seedUser(db, 'prefs-mine@example.com');
      const { id: otherId } = await seedUser(db, 'prefs-theirs@example.com');
      await gql(testSchema, db, otherId, UPDATE, {
        input: { leadTimeMinutes: 90 },
      });

      await gql(testSchema, db, userId, UPDATE, { input: { enabled: false } });

      const theirs = await db.query.notificationPreferences.findFirst({
        where: { userId: otherId },
      });
      expect(theirs?.leadTimeMinutes).toBe(90);
      expect(theirs?.enabled).toBe(true);
    });
  });

  describe('push subscriptions', () => {
    afterEach(async () => {
      await db.delete(pushSubscriptions);
    });

    it('throws when not authenticated', async () => {
      const result = await gql(testSchema, db, '', REGISTER, {
        input: { endpoint: 'https://push.example/a', p256dh: 'k', auth: 'a' },
      });
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('registers a subscription', async () => {
      const { id: userId } = await seedUser(db, 'push-new@example.com');

      const result = await gql(testSchema, db, userId, REGISTER, {
        input: {
          endpoint: 'https://push.example/new',
          p256dh: 'key',
          auth: 'auth',
          userAgent: 'Firefox',
        },
      });

      expect(result.errors).toBeUndefined();
      const rows = await db.query.pushSubscriptions.findMany({
        where: { userId },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.userAgent).toBe('Firefox');
    });

    it('updates the existing row when the same endpoint re-registers', async () => {
      const { id: userId } = await seedUser(db, 'push-again@example.com');
      const input = {
        endpoint: 'https://push.example/again',
        p256dh: 'first',
        auth: 'auth',
      };
      await gql(testSchema, db, userId, REGISTER, { input });

      await gql(testSchema, db, userId, REGISTER, {
        input: { ...input, p256dh: 'second' },
      });

      const rows = await db.query.pushSubscriptions.findMany({
        where: { userId },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.p256dh).toBe('second');
    });

    it('moves an endpoint to whoever registers it last', async () => {
      const { id: first } = await seedUser(db, 'push-shared-a@example.com');
      const { id: second } = await seedUser(db, 'push-shared-b@example.com');
      const input = {
        endpoint: 'https://push.example/shared',
        p256dh: 'key',
        auth: 'auth',
      };
      await gql(testSchema, db, first, REGISTER, { input });

      await gql(testSchema, db, second, REGISTER, { input });

      const rows = await db.query.pushSubscriptions.findMany({});
      expect(rows).toHaveLength(1);
      expect(rows[0]?.userId).toBe(second);
    });

    it('rejects an endpoint that is not a URL', async () => {
      const { id: userId } = await seedUser(db, 'push-badurl@example.com');
      const result = await gql(testSchema, db, userId, REGISTER, {
        input: { endpoint: 'not-a-url', p256dh: 'k', auth: 'a' },
      });
      expect(result.errors?.[0]?.message).toBeTruthy();
    });

    it('unregisters the caller’s own subscription', async () => {
      const { id: userId } = await seedUser(db, 'push-remove@example.com');
      await gql(testSchema, db, userId, REGISTER, {
        input: {
          endpoint: 'https://push.example/remove',
          p256dh: 'k',
          auth: 'a',
        },
      });

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($e: String!) { myUnregisterPushSubscription(endpoint: $e) }',
        { e: 'https://push.example/remove' },
      );

      expect(result.errors).toBeUndefined();
      const rows = await db.query.pushSubscriptions.findMany({
        where: { userId },
      });
      expect(rows).toHaveLength(0);
    });

    it("cannot unregister another user's subscription", async () => {
      const { id: owner } = await seedUser(db, 'push-owner@example.com');
      const { id: other } = await seedUser(db, 'push-other@example.com');
      await gql(testSchema, db, owner, REGISTER, {
        input: {
          endpoint: 'https://push.example/owned',
          p256dh: 'k',
          auth: 'a',
        },
      });

      await gql(
        testSchema,
        db,
        other,
        'mutation($e: String!) { myUnregisterPushSubscription(endpoint: $e) }',
        { e: 'https://push.example/owned' },
      );

      const rows = await db.query.pushSubscriptions.findMany({
        where: { userId: owner },
      });
      expect(rows).toHaveLength(1);
    });
  });

  describe('myPushPublicKey', () => {
    const QUERY = 'query { myPushPublicKey }';

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('is null when the server has no VAPID keys, so the client can hide the UI', async () => {
      vi.stubEnv('VAPID_PUBLIC_KEY', '');
      vi.stubEnv('VAPID_PRIVATE_KEY', '');
      vi.stubEnv('VAPID_SUBJECT', '');
      const { id: userId } = await seedUser(db, 'push-key-off@example.com');

      const result = await gql(testSchema, db, userId, QUERY);

      expect(result.errors).toBeUndefined();
      expect(result.data?.myPushPublicKey).toBeNull();
    });

    it('returns the key once all three VAPID variables are set', async () => {
      vi.stubEnv('VAPID_PUBLIC_KEY', 'public-key');
      vi.stubEnv('VAPID_PRIVATE_KEY', 'private-key');
      vi.stubEnv('VAPID_SUBJECT', 'mailto:admin@example.com');
      const { id: userId } = await seedUser(db, 'push-key-on@example.com');

      const result = await gql(testSchema, db, userId, QUERY);

      expect(result.data?.myPushPublicKey).toBe('public-key');
    });

    it('throws when not authenticated', async () => {
      const result = await gql(testSchema, db, '', QUERY);
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });
  });
});
