import type { Todo_TodoListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TodoListList } from '@/components/domain/todo-list/TodoListList';
import { Page } from '@/components/ui/page';
import { QueryState } from '@/components/ui/query-state';
import type { TodoListEvent } from '@/hooks/useTodoListsUpdated';
import { useTodoListsUpdated } from '@/hooks/useTodoListsUpdated';
import type { TodoEvent } from '@/hooks/useTodosUpdated';
import { useTodosUpdated } from '@/hooks/useTodosUpdated';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

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

type Client = ReturnType<typeof useApolloClient>;

function applyTodoEvent(client: Client, event: TodoEvent): void {
  const cached = client.cache.readQuery({ query: GET_TODO_LISTS_PAGE });
  if (!cached) return;

  const todos = cached.myTodos;
  if (event.type === 'deleted') {
    client.cache.writeQuery({
      query: GET_TODO_LISTS_PAGE,
      data: {
        ...cached,
        myTodos: todos.filter((t) => t.id !== event.deletedId),
      },
    });
  } else if (event.todo) {
    const incoming = event.todo;
    client.cache.writeQuery({
      query: GET_TODO_LISTS_PAGE,
      data: {
        ...cached,
        myTodos:
          event.type === 'created'
            ? todos.some((t) => t.id === incoming.id)
              ? todos
              : [...todos, incoming]
            : todos.map((t) => (t.id === incoming.id ? incoming : t)),
      },
    });
  }
}

function applyTodoListEvent(client: Client, event: TodoListEvent): void {
  const cached = client.cache.readQuery({ query: GET_TODO_LISTS_PAGE });
  if (!cached) return;

  const lists = cached.myTodoLists;
  if (event.type === 'deleted') {
    client.cache.writeQuery({
      query: GET_TODO_LISTS_PAGE,
      data: {
        ...cached,
        myTodoLists: lists.filter((l) => l.id !== event.deletedId),
      },
    });
  } else if (event.todoList) {
    const incoming = event.todoList;
    client.cache.writeQuery({
      query: GET_TODO_LISTS_PAGE,
      data: {
        ...cached,
        myTodoLists:
          event.type === 'created'
            ? lists.some((l) => l.id === incoming.id)
              ? lists
              : [...lists, incoming]
            : lists.map((l) => (l.id === incoming.id ? incoming : l)),
      },
    });
  }
}

export default function TodoListsPage() {
  const client = useApolloClient();
  const { data, loading, error } = useQuery(GET_TODO_LISTS_PAGE, {
    fetchPolicy: 'cache-and-network',
  });

  useTodosUpdated((event) => applyTodoEvent(client, event));
  useTodoListsUpdated((event) => applyTodoListEvent(client, event));

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
    <Page>
      <QueryState
        loading={loading && !data}
        error={error}
        errorLabel="Error loading todos"
      />
      <TodoListList
        lists={data?.myTodoLists ?? []}
        todosByListId={todosByListId}
      />
    </Page>
  );
}
