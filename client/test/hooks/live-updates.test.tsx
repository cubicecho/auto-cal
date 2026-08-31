import { useLiveUpdates } from '@/hooks/useLiveUpdates';
// @vitest-environment jsdom
/**
 * The subscription-to-invalidation mapping, which is the app's only path for a
 * change made somewhere else — another tab, another device, an API key — to
 * reach the screen you are looking at.
 *
 * It is worth pinning precisely because it is silent when it breaks: no error,
 * no failed request, just a screen that keeps showing what it fetched. The
 * assertions are about which root fields survive an event, since that is the
 * whole contract between this hook and `lib/cache.ts`.
 *
 * A `MockSubscriptionLink` stands in for the websocket. It broadcasts to every
 * active subscription, so each event reaches all three `onData` handlers — the
 * two that do not recognise the payload return without touching the cache,
 * which is itself worth having covered.
 */
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { MockSubscriptionLink } from '@apollo/client/testing';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

/** Every root field the assertions below look for, seeded so it can be lost. */
const SEED = {
  __typename: 'Query',
  myTodos: [{ __ref: 'Todo:t1' }],
  myTodoLists: [],
  myHabits: [],
  myTimeBlocks: [],
  myManualEvents: [],
  myActivityTypes: [],
  myProjects: [],
  myProject: null,
  mySchedule: [],
  myStats: {},
  myActivityTypeStats: [],
  myHabitStats: [],
  myHabitDetail: null,
};

let link: MockSubscriptionLink;
let cache: InMemoryCache;

function Subscriber() {
  useLiveUpdates();
  return null;
}

beforeEach(() => {
  link = new MockSubscriptionLink();
  cache = new InMemoryCache();
  cache.restore({
    ROOT_QUERY: { ...SEED },
    'Todo:t1': { __typename: 'Todo', id: 't1', title: 'Write the report' },
  });

  const client = new ApolloClient({ link, cache });
  render(
    <ApolloProvider client={client}>
      <Subscriber />
    </ApolloProvider>,
  );
});

/**
 * Push one server event onto every live subscription, and let it land: the
 * link delivers on a scheduler, so a microtask flush is not enough.
 */
async function emit(data: Record<string, unknown>): Promise<void> {
  await act(async () => {
    // Every field the three subscriptions select is present, because the link
    // broadcasts one payload to all of them and the cache warns about a field
    // its document asked for and did not get.
    const result = {
      myTodosUpdated: null,
      myTodoListsUpdated: null,
      myDataChanged: null,
      ...data,
    };
    link.simulateResult({ result: { data: result } });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const surviving = () =>
  Object.keys(cache.extract().ROOT_QUERY ?? {}).filter(
    (k) => k !== '__typename',
  );

const gone = (...fields: string[]) => {
  const left = surviving();
  return fields.every((f) => !left.includes(f));
};

describe('useLiveUpdates', () => {
  it('drops only the derived fields when a todo is updated', async () => {
    await emit({
      myTodosUpdated: {
        __typename: 'TodoEvent',
        type: 'updated',
        deletedId: null,
        todo: null,
      },
    });

    // The payload carries the whole todo, so normalization has already patched
    // every list holding it — the membership of `myTodos` cannot have changed.
    expect(surviving()).toContain('myTodos');
    expect(gone('mySchedule', 'myStats', 'myHabitStats')).toBe(true);
  });

  it('drops the list itself when a todo is created', async () => {
    await emit({
      myTodosUpdated: {
        __typename: 'TodoEvent',
        type: 'created',
        deletedId: null,
        todo: null,
      },
    });

    expect(gone('myTodos', 'mySchedule')).toBe(true);
  });

  it('evicts the entity a delete event names', async () => {
    await emit({
      myTodosUpdated: {
        __typename: 'TodoEvent',
        type: 'deleted',
        deletedId: 't1',
        todo: null,
      },
    });

    expect(cache.extract()['Todo:t1']).toBeUndefined();
    expect(gone('myTodos', 'mySchedule')).toBe(true);
  });

  it('handles a todo-list event on its own list field', async () => {
    await emit({
      myTodoListsUpdated: {
        __typename: 'TodoListEvent',
        type: 'created',
        deletedId: null,
        todoList: null,
      },
    });

    expect(gone('myTodoLists', 'mySchedule')).toBe(true);
    expect(surviving()).toContain('myTodos');
  });

  it('maps a timeBlock change onto the blocks and the schedule', async () => {
    await emit({
      myDataChanged: {
        __typename: 'DataChangedEvent',
        entity: 'timeBlock',
        ids: ['tb-1'],
      },
    });

    expect(gone('myTimeBlocks', 'mySchedule', 'myStats')).toBe(true);
    expect(surviving()).toContain('myTodos');
  });

  it('leaves the schedule alone for a project change', async () => {
    // A project on its own moves nothing the scheduler reads; the activityType
    // event that accompanies creating or archiving one is what drops DERIVED.
    await emit({
      myDataChanged: {
        __typename: 'DataChangedEvent',
        entity: 'project',
        ids: ['p-1'],
      },
    });

    expect(gone('myProjects', 'myProject')).toBe(true);
    expect(surviving()).toContain('mySchedule');
  });

  it('ignores an event with no payload', async () => {
    const before = surviving();

    await emit({ myTodosUpdated: null });

    expect(surviving()).toEqual(before);
  });
});
