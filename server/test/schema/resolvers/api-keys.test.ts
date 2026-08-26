import { graphql } from 'graphql';
import { beforeAll, describe, expect, it } from 'vitest';
import { createLoaders } from '../../../src/context.ts';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedUser,
} from './test-helpers.ts';

/** Execute with an authenticated API key context (for guard tests). */
async function gqlWithApiKey(
  testSchema: TestSchema,
  db: TestDb,
  userId: string,
  source: string,
  variableValues?: Record<string, unknown>,
) {
  return graphql({
    schema: testSchema,
    source,
    variableValues,
    contextValue: {
      db,
      userId,
      loaders: createLoaders(db),
      apiKey: { id: 'test-key-id', scopes: ['read', 'write'] as const },
    },
  });
}

describe('api-key resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  // ─── myApiKeys ────────────────────────────────────────────────────────────────

  describe('myApiKeys', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'query { myApiKeys { id } }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('returns active (non-revoked) keys', async () => {
      const { id: userId } = await seedUser(db, 'apikeys-list@example.com');
      await gql(
        testSchema,
        db,
        userId,
        'mutation($input: MyCreateApiKeyInput!) { myCreateApiKey(input: $input) { token } }',
        { input: { name: 'Key A', scopes: ['read'] } },
      );

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myApiKeys { id name } }',
      );
      expect(result.errors).toBeUndefined();
      expect((result.data?.myApiKeys as unknown[]).length).toBe(1);
    });

    it('does not expose keyHash on the ApiKey type', async () => {
      const { id: userId } = await seedUser(db, 'apikeys-nohash@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myApiKeys { id keyHash } }',
      );
      expect(result.errors?.[0]?.message).toMatch(
        /Cannot query field "keyHash"/,
      );
    });

    // Deleting the output field is not enough on its own: drizzle-graphql
    // derives the filter/order/distinct inputs from the same column list, and
    // they are reachable through the live User.apiKeys relation. Left in place
    // they let a caller confirm or binary-search the hash without selecting it.
    it('does not accept keyHash as a filter on the apiKeys relation', async () => {
      const { id: userId } = await seedUser(db, 'apikeys-nofilter@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { user { apiKeys(where: { keyHash: { eq: "x" } }) { id } } } }',
      );
      expect(result.errors?.[0]?.message).toMatch(
        /Field "keyHash" is not defined by type "ApiKeyFilters"/,
      );
    });

    it('does not accept keyHash as an ordering or distinct key', async () => {
      const { id: userId } = await seedUser(db, 'apikeys-noorder@example.com');
      const ordered = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { user { apiKeys(orderBy: { keyHash: { direction: asc } }) { id } } } }',
      );
      expect(ordered.errors?.[0]?.message).toMatch(
        /Field "keyHash" is not defined by type "ApiKeyOrderBy"/,
      );

      const distinct = await gql(
        testSchema,
        db,
        userId,
        'query { myTodos { user { apiKeys(distinct: [keyHash]) { id } } } }',
      );
      expect(distinct.errors?.[0]?.message).toMatch(
        /Value "keyHash" does not exist in "ApiKeyDistinctColumn"/,
      );
    });
  });

  // ─── myCreateApiKey ───────────────────────────────────────────────────────────

  describe('myCreateApiKey', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'mutation($input: MyCreateApiKeyInput!) { myCreateApiKey(input: $input) { token } }',
        { input: { name: 'X', scopes: ['read'] } },
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('throws when the request itself comes from an API key', async () => {
      const { id: userId } = await seedUser(db, 'apikey-guard@example.com');
      const result = await gqlWithApiKey(
        testSchema,
        db,
        userId,
        'mutation($input: MyCreateApiKeyInput!) { myCreateApiKey(input: $input) { token } }',
        { input: { name: 'X', scopes: ['read'] } },
      );
      expect(result.errors?.[0]?.message).toMatch(/api keys cannot manage/i);
    });

    it('creates a key and returns token + row', async () => {
      const { id: userId } = await seedUser(db, 'create-apikey@example.com');
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: MyCreateApiKeyInput!) { myCreateApiKey(input: $input) { token apiKey { id name keyPrefix } } }',
        { input: { name: 'My Key', scopes: ['read', 'write'] } },
      );
      expect(result.errors).toBeUndefined();
      const res = result.data?.myCreateApiKey as {
        token: string;
        apiKey: { name: string; keyPrefix: string };
      };
      expect(res.token).toBeDefined();
      expect(res.apiKey.name).toBe('My Key');
      expect(res.apiKey.keyPrefix).toBeDefined();
    });

    it('creates a key with expiresAt', async () => {
      const { id: userId } = await seedUser(
        db,
        'create-apikey-expires@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: MyCreateApiKeyInput!) { myCreateApiKey(input: $input) { apiKey { expiresAt } } }',
        {
          input: {
            name: 'Expiring',
            scopes: ['read'],
            expiresAt: '2099-01-01T00:00:00',
          },
        },
      );
      expect(result.errors).toBeUndefined();
      const row = result.data?.myCreateApiKey as {
        apiKey: { expiresAt: string };
      };
      expect(row.apiKey.expiresAt).not.toBeNull();
    });
  });

  // ─── myRevokeApiKey ───────────────────────────────────────────────────────────

  describe('myRevokeApiKey', () => {
    it('throws when request comes from an API key', async () => {
      const { id: userId } = await seedUser(
        db,
        'revoke-apikey-guard@example.com',
      );
      const result = await gqlWithApiKey(
        testSchema,
        db,
        userId,
        'mutation { myRevokeApiKey(id: "00000000-0000-0000-0000-000000000000") }',
      );
      expect(result.errors?.[0]?.message).toMatch(/api keys cannot manage/i);
    });

    it('revokes a key and returns true', async () => {
      const { id: userId } = await seedUser(db, 'revoke-apikey@example.com');
      const createResult = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: MyCreateApiKeyInput!) { myCreateApiKey(input: $input) { apiKey { id } } }',
        { input: { name: 'To Revoke', scopes: ['read'] } },
      );
      const keyId = (
        createResult.data?.myCreateApiKey as { apiKey: { id: string } }
      ).apiKey.id;

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myRevokeApiKey(id: $id) }',
        { id: keyId },
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myRevokeApiKey).toBe(true);
    });

    it('throws when key not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'revoke-apikey-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation { myRevokeApiKey(id: "00000000-0000-0000-0000-000000000000") }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when key belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'revoke-apikey-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(
        db,
        'revoke-apikey-other@example.com',
      );
      const createResult = await gql(
        testSchema,
        db,
        otherId,
        'mutation($input: MyCreateApiKeyInput!) { myCreateApiKey(input: $input) { apiKey { id } } }',
        { input: { name: 'Other Key', scopes: ['read'] } },
      );
      const keyId = (
        createResult.data?.myCreateApiKey as { apiKey: { id: string } }
      ).apiKey.id;

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myRevokeApiKey(id: $id) }',
        { id: keyId },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });
});
