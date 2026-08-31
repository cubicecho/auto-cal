import { appendToField, evictEntity, invalidate } from '@/lib/cache';
/**
 * What the invalidation helpers actually do to a cache.
 *
 * `src/lib/cache.test.ts` next to the module checks the *vocabulary* — that
 * `ROOT_FIELDS` still names fields the server has. This checks the behaviour,
 * because every mutation and every subscription event in the app funnels
 * through these three functions, and a regression in them is invisible: the
 * screen renders, it just renders yesterday's data.
 *
 * The cache is seeded with `restore` and read back with `extract` rather than
 * through documents, so the assertions are about normalized cache shape and
 * cannot drift with the SDL.
 */
import { InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';

function seeded(rootQuery: Record<string, unknown> = {}) {
  const cache = new InMemoryCache();
  cache.restore({
    ROOT_QUERY: { __typename: 'Query', ...rootQuery },
  });
  return cache;
}

const rootFields = (cache: InMemoryCache) =>
  Object.keys(cache.extract().ROOT_QUERY ?? {}).filter(
    (k) => k !== '__typename',
  );

describe('invalidate', () => {
  it('drops the named field and leaves the others', () => {
    const cache = seeded({ myTodos: [], myHabits: [] });

    invalidate(cache, 'myTodos');

    expect(rootFields(cache)).toEqual(['myHabits']);
  });

  it('drops every argument variation of a field, not just one', () => {
    // The reason eviction is by field name: `mySchedule` is cached per week,
    // and a todo that moved invalidates all of them, including weeks that are
    // not on screen.
    const cache = seeded({
      'mySchedule({"weekStart":"2026-08-24"})': [],
      'mySchedule({"weekStart":"2026-08-31"})': [],
      myTodos: [],
    });

    invalidate(cache, 'mySchedule');

    expect(rootFields(cache)).toEqual(['myTodos']);
  });

  it('takes several fields at once', () => {
    const cache = seeded({ myTodos: [], mySchedule: [], myStats: {} });

    invalidate(cache, 'myTodos', 'mySchedule', 'myStats');

    expect(rootFields(cache)).toEqual([]);
  });
});

describe('evictEntity', () => {
  it('removes the entity even while a list still references it', () => {
    const cache = seeded({ myTodos: [{ __ref: 'Todo:t1' }] });
    cache.restore({
      ...cache.extract(),
      'Todo:t1': { __typename: 'Todo', id: 't1', title: 'Write the report' },
    });

    evictEntity(cache, 'Todo', 't1');

    expect(cache.extract()['Todo:t1']).toBeUndefined();
    // The dangling reference is left behind on purpose — Apollo filters it out
    // when it reads the array, so no list has to be named here.
    expect(cache.extract().ROOT_QUERY?.myTodos).toEqual([{ __ref: 'Todo:t1' }]);
  });

  it('accepts a numeric id, as the generated ID variables produce', () => {
    const cache = seeded({ myTodos: [{ __ref: 'Todo:7' }] });
    cache.restore({
      ...cache.extract(),
      'Todo:7': { __typename: 'Todo', id: '7' },
    });

    evictEntity(cache, 'Todo', 7);

    expect(cache.extract()['Todo:7']).toBeUndefined();
  });
});

describe('appendToField', () => {
  it('splices the new entity onto the end of the parent list', () => {
    const cache = new InMemoryCache();
    cache.restore({
      ROOT_QUERY: {
        __typename: 'Query',
        myProjects: [{ __ref: 'Project:p1' }],
      },
      'Project:p1': {
        __typename: 'Project',
        id: 'p1',
        notes: [{ __ref: 'ProjectNote:n1' }],
      },
      'ProjectNote:n1': { __typename: 'ProjectNote', id: 'n1' },
      'ProjectNote:n2': { __typename: 'ProjectNote', id: 'n2' },
    });

    appendToField(cache, { __typename: 'Project', id: 'p1' }, 'notes', {
      __typename: 'ProjectNote',
      id: 'n2',
    });

    expect(cache.extract()['Project:p1']?.notes).toEqual([
      { __ref: 'ProjectNote:n1' },
      { __ref: 'ProjectNote:n2' },
    ]);
  });

  it('leaves a list the parent never cached alone', () => {
    // `cache.modify` only runs modifiers for fields already in the store, so
    // nothing here invents a one-item `notes` on a project that was fetched
    // without it. That is the behaviour we want: the next query for the field
    // reads through to the network instead of finding a partial list.
    const cache = new InMemoryCache();
    cache.restore({
      'Project:p1': { __typename: 'Project', id: 'p1' },
      'ProjectNote:n1': { __typename: 'ProjectNote', id: 'n1' },
    });

    appendToField(cache, { __typename: 'Project', id: 'p1' }, 'notes', {
      __typename: 'ProjectNote',
      id: 'n1',
    });

    expect(cache.extract()['Project:p1']?.notes).toBeUndefined();
  });
});
