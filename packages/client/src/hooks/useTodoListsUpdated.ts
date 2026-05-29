import type { TodoListsUpdatedSubscription } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { useSubscription } from '@apollo/client/react';

const TODO_LIST_UPDATED_SUB = graphql(`
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

export type TodoListEvent = TodoListsUpdatedSubscription['myTodoListsUpdated'];

export function useTodoListsUpdated(
  onEvent: (event: TodoListEvent) => void,
): void {
  useSubscription(TODO_LIST_UPDATED_SUB, {
    onData: ({ data }) => {
      const event = data.data?.myTodoListsUpdated;
      if (event) onEvent(event);
    },
  });
}
