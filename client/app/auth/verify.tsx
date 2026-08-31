import { graphql } from '@/__generated__/index.js';
import { storage } from '@/storage';
import { useMutation } from '@apollo/client/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

const VERIFY_MAGIC_LINK = graphql(`
  mutation VerifyMagicLink($token: String!) {
    verifyMagicLink(token: $token) {
      token
      userId
    }
  }
`);

export default function VerifyPage() {
  const router = useRouter();
  const { token: queryToken } = useLocalSearchParams<{ token?: string }>();

  const called = useRef(false);
  const [verify, { error }] = useMutation(VERIFY_MAGIC_LINK, {
    onCompleted(data) {
      storage.setItem('auth_token', data.verifyMagicLink.token);
      router.replace('/(app)/today');
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: verify is intentionally omitted — useMutation returns a new ref each render and the useRef guard ensures the mutation fires exactly once
  useEffect(() => {
    if (queryToken && !called.current) {
      called.current = true;
      verify({ variables: { token: queryToken } });
    }
  }, [queryToken]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <View className="text-center">
          <Text className="font-medium text-destructive">
            {error.message.includes('expired')
              ? 'This link has expired. Please request a new one.'
              : 'Invalid magic link.'}
          </Text>
          <a href="/auth/login" className="mt-2 text-sm underline">
            Back to login
          </a>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-muted-foreground">Signing you in…</Text>
    </View>
  );
}
