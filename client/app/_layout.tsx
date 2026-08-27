import { apolloClient } from '@/apollo-client';
import { useDarkMode } from '@/hooks/useDarkMode';
import { storage } from '@/storage';
import { ApolloProvider } from '@apollo/client/react';
import { Redirect, Stack, usePathname } from 'expo-router';
import '../global.css';
import '../src/index.css';

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
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </ApolloProvider>
  );
}
