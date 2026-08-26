import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { Platform } from 'react-native';
import { storage } from './storage';

// In dev set EXPO_PUBLIC_API_URL=http://localhost:3001 in client/.env.
// In production the variable is unset, so the URL is relative (/graphql) and
// resolves to the same Express server that serves the static bundle.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

function buildWsUrl(): string {
  if (API_URL) {
    // e.g. http://localhost:3001 → ws://localhost:3001/graphql
    return `${API_URL.replace(/^http/, 'ws')}/graphql`;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/graphql`;
  }
  // Fallback for native dev without explicit API_URL
  return 'ws://localhost:3001/graphql';
}

const wsLink = new GraphQLWsLink(
  createClient({
    url: buildWsUrl(),
    connectionParams: () => {
      const token = storage.getItem('auth_token');
      return token ? { authorization: `Bearer ${token}` } : {};
    },
  }),
);

const httpLink = new HttpLink({
  uri: `${API_URL}/graphql`,
  fetch: (uri, options) => {
    const token = storage.getItem('auth_token');
    const headers = new Headers(options?.headers as HeadersInit | undefined);
    if (token) headers.set('authorization', `Bearer ${token}`);
    return fetch(uri as RequestInfo, { ...(options as RequestInit), headers });
  },
});

// Route subscription operations to the WebSocket link; everything else to HTTP.
const splitLink = ApolloLink.split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return (
      def.kind === 'OperationDefinition' && def.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    // Match on extensions.code, not the message. The server used to throw bare
    // Errors, so this had to string-match 'Not authenticated' / 'Forbidden' and
    // any reword on the server silently disabled session expiry.
    const needsLogin = error.errors.some(
      (e) =>
        e.extensions?.code === 'UNAUTHENTICATED' ||
        e.extensions?.code === 'FORBIDDEN',
    );
    if (needsLogin) {
      storage.removeItem('auth_token');
      if (Platform.OS === 'web') window.location.replace('/auth/login');
    }
  }
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, splitLink]),
  cache: new InMemoryCache({
    typePolicies: {
      // `ScheduledItem.id` is the id of the todo or habit the item was
      // computed from, not an id of its own — the same todo appears in every
      // week it is scheduled or overdue in. Normalizing on it made one week's
      // schedule overwrite another's, so paging back and forth between weeks
      // showed the wrong times until a refetch landed. Keeping these
      // unnormalized stores each `mySchedule(weekStart:)` result whole, which
      // is what it is: a computed view, not an entity.
      ScheduledItem: { keyFields: false },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
