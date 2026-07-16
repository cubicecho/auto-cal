import type {
  DataChangedSubscription,
  DataEntity,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { useSubscription } from '@apollo/client/react';

const DATA_CHANGED_SUB = graphql(`
  subscription DataChanged {
    myDataChanged {
      entity
      ids
    }
  }
`);

export type DataChangedEvent = DataChangedSubscription['myDataChanged'];

/**
 * Subscribe to the generic entity-change stream and run `onChange` whenever the
 * given entity changes anywhere (this tab, another tab, another device). The
 * callback is the page's cue to refetch the queries it renders — there is no
 * payload to patch, unlike the typed todo/todo-list streams.
 */
export function useDataChanged(
  entity: DataEntity,
  onChange: (event: DataChangedEvent) => void,
): void {
  useSubscription(DATA_CHANGED_SUB, {
    onData: ({ data }) => {
      const event = data.data?.myDataChanged;
      if (event && event.entity === entity) onChange(event);
    },
  });
}
