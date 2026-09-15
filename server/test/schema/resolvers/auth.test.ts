import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { verifyToken } from '../../../src/auth.ts';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedUser,
} from './test-helpers.ts';

const REQUEST = `mutation ($email: String!) {
  requestMagicLink(email: $email) { ok magicLink token userId }
}`;

type Result = {
  ok: boolean;
  magicLink: string | null;
  token: string | null;
  userId: string | null;
};

describe('requestMagicLink', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function request(email: string): Promise<Result> {
    const result = await gql(testSchema, db, '', REQUEST, { email });
    expect(result.errors).toBeUndefined();
    return result.data?.requestMagicLink as Result;
  }

  it('returns no session while magic links are required', async () => {
    vi.stubEnv('AUTH_MAGIC_LINK', undefined);
    vi.stubEnv('NODE_ENV', 'production');
    const res = await request('link@example.com');
    expect(res).toEqual({
      ok: true,
      magicLink: null,
      token: null,
      userId: null,
    });
  });

  describe('with AUTH_MAGIC_LINK=false', () => {
    it('signs an existing user straight in with a session JWT', async () => {
      vi.stubEnv('AUTH_MAGIC_LINK', 'false');
      const { id } = await seedUser(db, 'direct@example.com');
      const res = await request('Direct@Example.com');
      expect(res.userId).toBe(id);
      expect(res.magicLink).toBeNull();
      const payload = await verifyToken(res.token ?? '');
      expect(payload?.sub).toBe(id);
    });

    it('creates the account for a new address', async () => {
      vi.stubEnv('AUTH_MAGIC_LINK', 'false');
      const res = await request('new@example.com');
      const user = await db.query.users.findFirst({
        where: { email: 'new@example.com' },
      });
      expect(user?.id).toBe(res.userId);
    });
  });
});
