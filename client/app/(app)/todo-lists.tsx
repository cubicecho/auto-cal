import type { Todo_TodoListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TodoListList } from '@/components/domain/todo-list/TodoListList';
import { Page } from '@/components/ui/page';
import { QueryState } from '@/components/ui/query-state';
import { useQuery } from '@apollo/client/react';
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

export default function TodoListsPage() {
  const { data, loading, error } = useQuery(GET_TODO_LISTS_PAGE, {
    fetchPolicy: 'cache-and-network',
  });

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
