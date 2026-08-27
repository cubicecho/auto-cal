/**
 * Tenant isolation for the generated, scope-wrapped queries.
 *
 * `scopeRootFields` (src/schema/scope.ts) is now the only thing standing
 * between a caller-supplied `where` and another user's rows, and the machinery
 * it leans on — the generated resolver's filter composition, and the AND-ed
 * foreign-key predicate on relation loads — lives in a bumpable dependency.
 * These tests pin the behaviour so a `@vantreeseba/drizzle-graphql` upgrade
 * that changes it fails here rather than in production.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import {
  TABLE_SCOPE,
  assertEveryTableScoped,
} from '../../../src/schema/scope.ts';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedActivityType,
  seedHabit,
  seedTimeBlock,
  seedTodo,
  seedTodoList,
  seedUser,
} from './test-helpers.ts';

describe('root query scoping', () => {
  let db: TestDb;
  let testSchema: TestSchema;
  let me: string;
  let other: string;
  let myTodoId: string;
  let theirTodoId: string;
  let theirListId: string;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);

    me = (await seedUser(db, 'scope-me@example.com')).id;
    other = (await seedUser(db, 'scope-other@example.com')).id;

    const myAt = await seedActivityType(db, me);
    const myList = await seedTodoList(db, me, myAt.id);
    myTodoId = (await seedTodo(db, me, myList.id, { title: 'Mine' })).id;
    await seedHabit(db, me, myAt.id, { title: 'My habit' });
    await seedTimeBlock(db, me, myAt.id);

    const theirAt = await seedActivityType(db, other);
    const theirList = await seedTodoList(db, other, theirAt.id);
    theirListId = theirList.id;
    theirTodoId = (await seedTodo(db, other, theirList.id, { title: 'Theirs' }))
      .id;
    await seedHabit(db, other, theirAt.id, { title: 'Their habit' });
    await seedTimeBlock(db, other, theirAt.id);
  }, 30000);

  async function todoIds(source: string, variables?: Record<string, unknown>) {
    const result = await gql(testSchema, db, me, source, variables);
    expect(result.errors).toBeUndefined();
    return (result.data?.myTodos as Array<{ id: string }>).map((t) => t.id);
  }

  // ─── the caller's filter can only narrow ───────────────────────────────────

  // The scope and the caller's `where` are separate AND operands. The first
  // case is the one that breaks if they are ever merged into a single object:
  // the caller's `userId` key would replace the scope's outright. The rest hold
  // under either composition today, and are here so a change in how the
  // dependency combines sibling fields with `OR`/`NOT` does not pass silently.
  it('ignores a userId filter naming another user', async () => {
    const ids = await todoIds(
      'query($u: UUID!) { myTodos(where: { userId: { eq: $u } }) { id } }',
      { u: other },
    );
    expect(ids).toEqual([]);
  });

  it('does not let an OR branch reach another user', async () => {
    const ids = await todoIds(
      `query($me: UUID!, $them: UUID!) {
         myTodos(where: { OR: [{ userId: { eq: $them } }, { userId: { eq: $me } }] }) { id }
       }`,
      { me, them: other },
    );
    expect(ids).toEqual([myTodoId]);
    expect(ids).not.toContain(theirTodoId);
  });

  it('does not let NOT invert the scope', async () => {
    const ids = await todoIds(
      'query($u: UUID!) { myTodos(where: { NOT: { userId: { eq: $u } } }) { id } }',
      { u: me },
    );
    expect(ids).toEqual([]);
  });

  it('does not let a relation filter reach another user', async () => {
    const ids = await todoIds(
      'query($l: UUID!) { myTodos(where: { list: { id: { eq: $l } } }) { id } }',
      { l: theirListId },
    );
    expect(ids).toEqual([]);
  });

  // ─── every scoped list is isolated ─────────────────────────────────────────

  it.each([
    ['myTodos', 'Mine', 'Theirs'],
    ['myHabits', 'My habit', 'Their habit'],
  ])('%s returns only the caller rows', async (field, mine, theirs) => {
    const result = await gql(
      testSchema,
      db,
      me,
      `query { ${field} { title } }`,
    );
    expect(result.errors).toBeUndefined();
    const titles = (result.data?.[field] as Array<{ title: string }>).map(
      (r) => r.title,
    );
    expect(titles).toContain(mine);
    expect(titles).not.toContain(theirs);
  });

  // myProjects has its own isolation test in projects.test.ts, where the seed
  // actually creates one.
  it.each(['myActivityTypes', 'myTodoLists', 'myTimeBlocks'])(
    '%s returns only the caller rows',
    async (field) => {
      const result = await gql(
        testSchema,
        db,
        me,
        `query { ${field} { userId } }`,
      );
      expect(result.errors).toBeUndefined();
      const rows = result.data?.[field] as Array<{ userId: string }>;
      expect(rows.every((r) => r.userId === me)).toBe(true);
    },
  );

  it('myProfile returns the caller, not an arbitrary user', async () => {
    const result = await gql(
      testSchema,
      db,
      me,
      'query($u: UUID!) { myProfile(where: { id: { eq: $u } }) { id } }',
      { u: other },
    );
    expect(result.errors).toBeUndefined();
    expect(result.data?.myProfile).toBeNull();
  });

  // ─── relation traversal stays scoped ───────────────────────────────────────

  // The generated relation loader ANDs the foreign-key predicate with whatever
  // filter the caller supplies, so a nested `where` narrows within the parent
  // and can never escape it. Without that, `myProfile` — a graph entry point
  // onto every relation the users table has — would be a hole.
  it('cannot escape the caller through a nested relation filter', async () => {
    const result = await gql(
      testSchema,
      db,
      me,
      `query($them: UUID!) {
         myProfile { todos(where: { userId: { eq: $them } }) { id } }
       }`,
      { them: other },
    );
    expect(result.errors).toBeUndefined();
    const profile = result.data?.myProfile as { todos: Array<{ id: string }> };
    expect(profile.todos).toEqual([]);
  });

  it('cannot reach another user by hopping todo → list → todos', async () => {
    const result = await gql(
      testSchema,
      db,
      me,
      'query { myTodos { list { todos { id } } } }',
    );
    expect(result.errors).toBeUndefined();
    const reached = (
      result.data?.myTodos as Array<{ list: { todos: Array<{ id: string }> } }>
    ).flatMap((t) => t.list.todos.map((n) => n.id));
    expect(reached).not.toContain(theirTodoId);
  });

  // ─── the scope needs an authenticated caller ───────────────────────────────

  it.each([
    'myProfile { id }',
    'myTodos { id }',
    'myHabits { id }',
    'myProjects { id }',
    'myApiKeys { id }',
    'myActivityTypes { id }',
    'myTodoLists { id }',
    'myTimeBlocks { id }',
  ])('rejects %s without a caller', async (selection) => {
    const result = await gql(testSchema, db, '', `query { ${selection} }`);
    expect(result.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  // ─── every table carries a scope ───────────────────────────────────────────

  // The scope is per *table*, so a table with no entry is unscoped on every
  // path that reads it — including relation fields, which no root-field
  // wrapper sees. build-config.ts runs this check over the real Drizzle schema
  // at import time; this pins that it actually rejects a gap.
  describe('assertEveryTableScoped', () => {
    it('accepts a schema whose tables are all scoped', () => {
      expect(() =>
        assertEveryTableScoped(Object.keys(TABLE_SCOPE)),
      ).not.toThrow();
    });

    it('names the tables that have no scope', () => {
      expect(() =>
        assertEveryTableScoped([...Object.keys(TABLE_SCOPE), 'invoices']),
      ).toThrow(/invoices/);
    });
  });
});
