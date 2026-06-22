import { beforeAll, describe, expect, it } from 'vitest';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedUser,
} from './test-helpers.ts';

describe('profile resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  // ─── myProfile ────────────────────────────────────────────────────────────────

  describe('myProfile', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'query { myProfile { id } }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('returns the current user profile', async () => {
      const { id: userId, email } = await seedUser(db, 'profile@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myProfile { id email } }',
      );
      expect(result.errors).toBeUndefined();
      const profile = result.data?.myProfile as { id: string; email: string };
      expect(profile.id).toBe(userId);
      expect(profile.email).toBe(email);
    });
  });

  // ─── myUpdateProfile ──────────────────────────────────────────────────────────

  describe('myUpdateProfile', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'mutation { myUpdateProfile(timezone: "UTC") }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('updates the user timezone and returns true', async () => {
      const { id: userId } = await seedUser(db, 'update-profile@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($tz: String!) { myUpdateProfile(timezone: $tz) }',
        { tz: 'America/New_York' },
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myUpdateProfile).toBe(true);
    });

    it('throws for an invalid timezone', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-profile-badtz@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation { myUpdateProfile(timezone: "Not/ATimezone") }',
      );
      expect(result.errors?.[0]?.message).toMatch(/invalid timezone/i);
    });
  });
});
