import { apolloClient } from '@/apollo-client';
import { RouteError } from '@/components/ui/route-error';
import { ConfirmProvider } from '@/components/ui/confirm';
import { ToastProvider } from '@/components/ui/toast';
import { useDarkMode } from '@/hooks/useDarkMode';
import { storage } from '@/storage';
import { ApolloProvider } from '@apollo/client/react';
import type { ErrorBoundaryProps } from 'expo-router';
import { Redirect, Stack, usePathname } from 'expo-router';
import '../global.css';
import '../src/index.css';

/**
 * expo-router mounts a named `ErrorBoundary` export from a route or layout file
 * around that segment's tree. This one is the outermost: without it a render
 * crash anywhere unmounts the whole app to a blank white page with the error
 * only in the console. `retry` re-renders the segment, which is enough to
 * recover from a transient failure without a full reload.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <RouteError error={error} reset={retry} />;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const token = storage.getItem('auth_token');

  if (!token && !pathname.startsWith('/auth')) {
    return <Redirect href="/auth/login" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  // Applies the stored theme on the /auth screens, which sit outside (app).
  useDarkMode();

  return (
    <ApolloProvider client={apolloClient}>
      {/* Outside the guard so a toast survives a redirect to /auth/login. */}
      <ToastProvider>
        <ConfirmProvider>
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }} />
          </AuthGuard>
        </ConfirmProvider>
      </ToastProvider>
    </ApolloProvider>
  );
}
