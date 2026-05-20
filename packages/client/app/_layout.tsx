import { apolloClient } from '@/apollo-client';
import { storage } from '@/storage';
import { ApolloProvider } from '@apollo/client/react';
import { Redirect, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import '../global.css';
import '../src/index.css';

function useDarkMode() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const stored = storage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
  }, []);
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
  useDarkMode();

  return (
    <ApolloProvider client={apolloClient}>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </ApolloProvider>
  );
}
