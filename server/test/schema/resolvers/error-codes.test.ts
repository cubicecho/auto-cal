/**
 * Error codes on the caller-fixable failures.
 *
 * `formatError` (src/index.ts) replaces the message of any error still tagged
 * INTERNAL_SERVER_ERROR when NODE_ENV is production, so a resolver that throws
 * a bare `Error` for something the caller could fix ships them "Internal server
 * error" and nothing else. These are the paths where the message is the whole
 * point — a wrong timezone, a list that still has todos, an expired login link
 * — so the code is the contract, not the wording.
 *
 * The `/not found/i` and `/forbidden/i` message assertions elsewhere in this
 * directory cover NOT_FOUND and FORBIDDEN on the ownership guards; this file
 * covers what those guards don't.
 */

import { graphql } from 'graphql';
import { beforeAll, describe, expect, it } from 'vitest';
import { createLoaders } from '../../../src/context.ts';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedActivityType,
  seedTodo,
  seedTodoList,
  seedUser,
} from './test-helpers.ts';

describe('error codes on caller-fixable failures', () => {
  let db: TestDb;
  let testSchema: TestSchema;
  let userId: string;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
    userId = (await seedUser(db, 'error-codes@example.com')).id;
  }, 30000);

  const codeOf = (result: Awaited<ReturnType<typeof gql>>) =>
    result.errors?.[0]?.extensions?.code;

  it('tags an unknown timezone BAD_USER_INPUT', async () => {
    const result = await gql(
      testSchema,
      db,
      userId,
      'mutation { myUpdateProfile(timezone: "Mars/Olympus_Mons") }',
    );
    expect(codeOf(result)).toBe('BAD_USER_INPUT');
    expect(result.errors?.[0]?.message).toMatch(/invalid timezone/i);
  });

  it('tags deleting a non-empty list BAD_USER_INPUT', async () => {
    const at = await seedActivityType(db, userId);
    const list = await seedTodoList(db, userId, at.id);
    await seedTodo(db, userId, list.id);

    const result = await gql(
      testSchema,
      db,
      userId,
      'mutation($id: ID!) { myDeleteTodoList(id: $id) }',
      { id: list.id },
    );
    expect(codeOf(result)).toBe('BAD_USER_INPUT');
    expect(result.errors?.[0]?.message).toMatch(/cannot delete/i);
  });

  it('tags a mismatched note reorder BAD_USER_INPUT', async () => {
    const created = await gql(
      testSchema,
      db,
      userId,
      'mutation { myCreateProject(input: { name: "Reorder" }) { id } }',
    );
    const projectId = (created.data?.myCreateProject as { id: string }).id;
    const note = await gql(
      testSchema,
      db,
      userId,
      `mutation($id: ID!) {
         myCreateProjectNote(input: { projectId: $id, title: "Note" }) { id }
       }`,
      { id: projectId },
    );
    // Assert the setup landed: if the note were missing, the reorder below
    // would match an empty set and the test would pass vacuously.
    expect(note.data?.myCreateProjectNote).toBeTruthy();

    // A well-formed id that is not one of this project's notes. An *empty*
    // noteIds would not reach the mismatch branch — Zod rejects it first, and
    // that path is BAD_USER_INPUT via formatError rather than the resolver.
    const result = await gql(
      testSchema,
      db,
      userId,
      `mutation($id: ID!) {
         myReorderProjectNotes(
           input: { projectId: $id, noteIds: ["00000000-0000-0000-0000-000000000000"] }
         ) { id }
       }`,
      { id: projectId },
    );
    expect(codeOf(result)).toBe('BAD_USER_INPUT');
    expect(result.errors?.[0]?.message).toMatch(/noteIds/);
  });

  it('tags an unparseable weekStart BAD_USER_INPUT', async () => {
    const result = await gql(
      testSchema,
      db,
      userId,
      'query { mySchedule(weekStart: "2026-99-99") { id } }',
    );
    expect(codeOf(result)).toBe('BAD_USER_INPUT');
  });

  it('tags an invalid magic link BAD_USER_INPUT, not UNAUTHENTICATED', async () => {
    const result = await gql(
      testSchema,
      db,
      userId,
      'mutation { verifyMagicLink(token: "not-a-token") { token } }',
    );
    // UNAUTHENTICATED would be read by apollo-client.ts as session expiry and
    // drop the stored token — wrong response to a bad link on the login screen.
    expect(codeOf(result)).toBe('BAD_USER_INPUT');
  });

  // API keys cannot mint or revoke keys: a leaked key must not be able to
  // outlive the revocation it was issued under.
  it.each([
    [
      'myCreateApiKey',
      'myCreateApiKey(input: { name: "x", scopes: ["read"] }) { token }',
    ],
    [
      'myRevokeApiKey',
      'myRevokeApiKey(id: "00000000-0000-0000-0000-000000000000")',
    ],
  ])('tags %s called with an API key FORBIDDEN', async (_name, selection) => {
    const result = await graphql({
      schema: testSchema,
      source: `mutation { ${selection} }`,
      contextValue: {
        db,
        userId,
        apiKey: { id: 'key-id', scopes: ['read', 'write'] as const },
        loaders: createLoaders(db),
      },
    });
    expect(result.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    expect(result.errors?.[0]?.message).toMatch(/cannot manage other keys/i);
  });
});
