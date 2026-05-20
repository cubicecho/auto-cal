import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { Platform } from 'react-native';
import { storage } from './storage';

// In dev set EXPO_PUBLIC_API_URL=http://localhost:4000 in packages/client/.env.
// In production the variable is unset, so the URL is relative (/graphql) and
// resolves to the same Express server that serves the static bundle.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const httpLink = new HttpLink({
  uri: `${API_URL}/graphql`,
  fetch: (uri, options) => {
    const token = storage.getItem('auth_token');
    const headers = new Headers(options?.headers as HeadersInit | undefined);
    if (token) headers.set('authorization', `Bearer ${token}`);
    return fetch(uri as RequestInfo, { ...(options as RequestInit), headers });
  },
});

const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    const needsLogin = error.errors.some(
      (e) =>
        e.message.includes('Not authenticated') || e.message === 'Forbidden',
    );
    if (needsLogin) {
      storage.removeItem('auth_token');
      if (Platform.OS === 'web') window.location.replace('/auth/login');
    }
  }
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
