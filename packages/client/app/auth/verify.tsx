import { graphql } from '@/__generated__/index.js';
import { storage } from '@/storage';
import { useMutation } from '@apollo/client/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

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
      router.replace('/(app)/dashboard');
    },
  });

  useEffect(() => {
    if (queryToken && !called.current) {
      called.current = true;
      verify({ variables: { token: queryToken } });
    }
  }, [queryToken]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="font-medium text-destructive">
            {error.message.includes('expired')
              ? 'This link has expired. Please request a new one.'
              : 'Invalid magic link.'}
          </p>
          <a href="/auth/login" className="mt-2 block text-sm underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  );
}
