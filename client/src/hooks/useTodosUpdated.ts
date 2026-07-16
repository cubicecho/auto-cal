import type { TodosUpdatedSubscription } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { useSubscription } from '@apollo/client/react';

const TODO_UPDATED_SUB = graphql(`
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

export type TodoEvent = TodosUpdatedSubscription['myTodosUpdated'];

export function useTodosUpdated(onEvent: (event: TodoEvent) => void): void {
  useSubscription(TODO_UPDATED_SUB, {
    onData: ({ data }) => {
      const event = data.data?.myTodosUpdated;
      if (event) onEvent(event);
    },
  });
}
