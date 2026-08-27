/**
 * The app's single subscriber to the server's change streams.
 *
 * Mounted once, in `app/(app)/_layout.tsx`. Every event is translated into the
 * same `lib/cache.ts` vocabulary mutations use, so a change made in another
 * tab, on another device, or by an API key reaches the cache by exactly the
 * route a local mutation would.
 *
 * What this replaced: each page ran its own `useSubscription`, enumerated the
 * entities it thought it cared about, and called its own `refetch()`. That had
 * three problems. The entity list was hand-written per page, so a page that
 * forgot `timeBlock` silently rendered a stale schedule. `refetch()` only
 * refreshes the one query that owns it, so a change reached the page you were
 * looking at and no other. And every page opened its own subscriptions —
 * roughly two dozen live operations for eight screens, each one re-filtering
 * the same broadcast.
 *
 * Invalidating a root field instead reaches every mounted consumer of that
 * field at once, which is why the mapping below can live in one place and be
 * checked once.
 */

import type { DataEntity, TodoEventType } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { DERIVED, type RootField, evictEntity, invalidate } from '@/lib/cache';
import { useApolloClient, useSubscription } from '@apollo/client/react';

const TODOS_UPDATED = graphql(`
  subscription TodosUpdated {
    myTodosUpdated {
      type
      deletedId
      todo {
        ...Todo_TodoList
      }
    }
  }
`);

const TODO_LISTS_UPDATED = graphql(`
  subscription TodoListsUpdated {
    myTodoListsUpdated {
      type
      deletedId
      todoList {
        ...TodoList_TodoListList
      }
    }
  }
`);

const DATA_CHANGED = graphql(`
  subscription DataChanged {
    myDataChanged {
      entity
      ids
    }
  }
`);

/**
 * Which root fields each `dataChanged` entity invalidates.
 *
 * A `Record` keyed by `DataEntity` rather than a lookup with a default: adding
 * an entity to the SDL then fails to compile here until someone says what it
 * affects, which is the check the per-page entity lists never had.
 *
 * `project` alone does not carry `DERIVED` — creating or archiving a project
 * publishes an `activityType` event too, and that one does.
 */
const DATA_FIELDS: Record<DataEntity, readonly RootField[]> = {
  activityType: ['myActivityTypes', ...DERIVED],
  habit: ['myHabits', ...DERIVED],
  project: ['myProjects', 'myProject'],
  timeBlock: ['myTimeBlocks', ...DERIVED],
};

/**
 * The subscription payloads carry the full entity, so Apollo has already
 * normalized it by the time these run — an `updated` event needs nothing but
 * the derived fields dropped. Only membership changes touch the list field.
 */
function fieldsFor(
  type: TodoEventType,
  listField: RootField,
): readonly RootField[] {
  return type === 'updated' ? DERIVED : [listField, ...DERIVED];
}

export function useLiveUpdates(): void {
  const { cache } = useApolloClient();

  useSubscription(TODOS_UPDATED, {
    onData: ({ data }) => {
      const event = data.data?.myTodosUpdated;
      if (!event) return;
      if (event.deletedId) evictEntity(cache, 'Todo', event.deletedId);
      invalidate(cache, ...fieldsFor(event.type, 'myTodos'));
    },
  });

  useSubscription(TODO_LISTS_UPDATED, {
    onData: ({ data }) => {
      const event = data.data?.myTodoListsUpdated;
      if (!event) return;
      if (event.deletedId) evictEntity(cache, 'TodoList', event.deletedId);
      invalidate(cache, ...fieldsFor(event.type, 'myTodoLists'));
    },
  });

  useSubscription(DATA_CHANGED, {
    onData: ({ data }) => {
      const event = data.data?.myDataChanged;
      if (!event) return;
      invalidate(cache, ...DATA_FIELDS[event.entity]);
    },
  });
}
