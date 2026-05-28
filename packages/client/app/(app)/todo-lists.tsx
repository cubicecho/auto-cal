import type {
  GetTodoListsPageQuery,
  Todo_TodoListFragment,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TodoListList } from '@/components/domain/todo-list/TodoListList';
import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo, useRef } from 'react';

const GET_TODO_LISTS_PAGE = graphql(`
  query GetTodoListsPage {
    myTodoLists {
      ...TodoList_TodoListList
    }
    myTodos {
      ...Todo_TodoList
    }
  }
`);

const TODO_UPDATED_SUB = graphql(`
  subscription TodoUpdated {
    myTodosUpdated {
      type
      deletedId
      todo {
        ...Todo_TodoList
      }
    }
  }
`);

const TODO_LIST_UPDATED_SUB = graphql(`
  subscription TodoListUpdated {
    myTodoListsUpdated {
      type
      deletedId
      todoList {
        ...TodoList_TodoListList
      }
    }
  }
`);

export default function TodoListsPage() {
  const { data, loading, error, subscribeToMore } = useQuery(
    GET_TODO_LISTS_PAGE,
    { fetchPolicy: 'cache-and-network' },
  );

  // Guard against React StrictMode double-invocation creating duplicate subs.
  const subscribedRef = useRef(false);

  // Subscribe to todo events and merge into the cached query result.
  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;
    const unsubTodos = subscribeToMore({
      document: TODO_UPDATED_SUB,
      updateQuery(prev, { subscriptionData }) {
        const event = subscriptionData.data?.myTodosUpdated;
        if (!event) return prev as GetTodoListsPageQuery;

        const todos = (prev.myTodos ?? []) as GetTodoListsPageQuery['myTodos'];

        if (event.type === 'deleted') {
          return {
            ...prev,
            myTodos: todos.filter((t) => t.id !== event.deletedId),
          } as GetTodoListsPageQuery;
        }

        if (!event.todo) return prev as GetTodoListsPageQuery;
        const incoming = event.todo as GetTodoListsPageQuery['myTodos'][number];

        if (event.type === 'created') {
          // Avoid duplicates (optimistic update may have already added it)
          const exists = todos.some((t) => t.id === incoming.id);
          return {
            ...prev,
            myTodos: exists ? todos : [...todos, incoming],
          } as GetTodoListsPageQuery;
        }

        // updated
        return {
          ...prev,
          myTodos: todos.map((t) => (t.id === incoming.id ? incoming : t)),
        } as GetTodoListsPageQuery;
      },
    });

    const unsubLists = subscribeToMore({
      document: TODO_LIST_UPDATED_SUB,
      updateQuery(prev, { subscriptionData }) {
        const event = subscriptionData.data?.myTodoListsUpdated;
        if (!event) return prev as GetTodoListsPageQuery;

        const lists = (prev.myTodoLists ??
          []) as GetTodoListsPageQuery['myTodoLists'];

        if (event.type === 'deleted') {
          return {
            ...prev,
            myTodoLists: lists.filter((l) => l.id !== event.deletedId),
          } as GetTodoListsPageQuery;
        }

        if (!event.todoList) return prev as GetTodoListsPageQuery;
        const incoming =
          event.todoList as GetTodoListsPageQuery['myTodoLists'][number];

        if (event.type === 'created') {
          const exists = lists.some((l) => l.id === incoming.id);
          return {
            ...prev,
            myTodoLists: exists ? lists : [...lists, incoming],
          } as GetTodoListsPageQuery;
        }

        // updated
        return {
          ...prev,
          myTodoLists: lists.map((l) => (l.id === incoming.id ? incoming : l)),
        } as GetTodoListsPageQuery;
      },
    });

    return () => {
      subscribedRef.current = false;
      unsubTodos();
      unsubLists();
    };
  }, [subscribeToMore]);

  const todosByListId = useMemo(() => {
    const map = new Map<string, Todo_TodoListFragment[]>();
    for (const todo of data?.myTodos ?? []) {
      if (!todo.list?.id) continue;
      const bucket = map.get(todo.list.id) ?? [];
      bucket.push(todo);
      map.set(todo.list.id, bucket);
    }
    for (const todos of map.values()) {
      todos.sort((a, b) => {
        const aDone = a.completedAt ? 1 : 0;
        const bDone = b.completedAt ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return (
          new Date(b.createdAt as string).getTime() -
          new Date(a.createdAt as string).getTime()
        );
      });
    }
    return map;
  }, [data?.myTodos]);

  return (
    <div className="container mx-auto flex-1 overflow-y-auto px-4 py-6">
      {error && (
        <p className="text-destructive text-sm">
          Error loading todos: {error.message}
        </p>
      )}
      {loading && !data && (
        <p className="text-muted-foreground text-sm">Loading…</p>
      )}
      <TodoListList
        lists={data?.myTodoLists ?? []}
        todosByListId={todosByListId}
      />
    </div>
  );
}
