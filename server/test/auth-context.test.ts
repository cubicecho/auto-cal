import type { DB } from '@auto-cal/db';
import { apiKeys } from '@auto-cal/db/schema';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { generateApiKey } from '../src/api-keys.ts';
import { buildContext, extractToken } from '../src/auth-context.ts';
import { signMagicToken, signSessionToken } from '../src/auth.ts';
import {
  type TestDb,
  createTestDb,
  seedUser,
} from './schema/resolvers/test-helpers.ts';

describe('extractToken', () => {
  it('strips a Bearer prefix in any case and accepts a bare token', () => {
    expect(extractToken('Bearer abc')).toBe('abc');
    expect(extractToken('bearer  abc ')).toBe('abc');
    expect(extractToken('abc')).toBe('abc');
    expect(extractToken('  ')).toBeUndefined();
    expect(extractToken(undefined)).toBeUndefined();
  });
});

describe('buildContext', () => {
  let db: TestDb;
  let userId: string;

  beforeAll(async () => {
    db = await createTestDb();
    ({ id: userId } = await seedUser(db, 'ctx@example.com'));
  }, 30000);

  const ctx = (token?: string) => buildContext(db as unknown as DB, token);

  it('authenticates a session JWT', async () => {
    const token = await signSessionToken(userId, 'ctx@example.com');
    expect((await ctx(token)).userId).toBe(userId);
  });

  it('authenticates a live API key and records its scopes', async () => {
    const { token, hash, prefix } = generateApiKey();
    await db.insert(apiKeys).values({
      userId,
      name: 'test',
      keyHash: hash,
      keyPrefix: prefix,
      scopes: ['read'],
    });
    const context = await ctx(token);
    expect(context.userId).toBe(userId);
    expect(context.apiKey?.scopes).toEqual(['read']);
  });

  // The raw-UUID fallback and BYPASS_AUTH_UUID are gone: a user id is not a
  // credential in any environment.
  it.each(['development', 'test', 'production'])(
    'rejects a raw user id as a token (NODE_ENV=%s)',
    async (env) => {
      vi.stubEnv('NODE_ENV', env);
      vi.stubEnv('BYPASS_AUTH_UUID', userId);
      try {
        expect((await ctx(userId)).userId).toBeUndefined();
      } finally {
        vi.unstubAllEnvs();
      }
    },
  );

  it('does not treat a magic-link token as a session', async () => {
    const token = await signMagicToken('ctx@example.com');
    expect((await ctx(token)).userId).toBeUndefined();
  });

  it('is unauthenticated with no token', async () => {
    expect((await ctx()).userId).toBeUndefined();
  });
});
