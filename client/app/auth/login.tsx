import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { FormElement } from '@/components/ui/form-element';
import { Input } from '@/components/ui/input';
import { useMutation } from '@apollo/client/react';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const REQUEST_MAGIC_LINK = graphql(`
  mutation RequestMagicLink($email: String!) {
    requestMagicLink(email: $email) {
      ok
      magicLink
    }
  }
`);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  const [requestLink, { loading, error }] = useMutation(REQUEST_MAGIC_LINK, {
    onCompleted(data) {
      setMagicLink(data.requestMagicLink.magicLink ?? null);
      setSubmitted(true);
    },
  });

  function handleSubmit() {
    requestLink({ variables: { email } });
  }

  if (submitted && magicLink) {
    return <DevMagicLink email={email} magicLink={magicLink} />;
  }

  if (submitted && !magicLink) {
    return (
      <CheckEmail
        email={email}
        onReset={() => {
          setSubmitted(false);
          setEmail('');
        }}
      />
    );
  }

  return (
    <LoginForm
      email={email}
      loading={loading}
      error={error}
      onEmailChange={setEmail}
      onSubmit={handleSubmit}
    />
  );
}

/** Full-height centering box every state on this route shares. */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 flex-col items-center justify-center bg-background p-4">
      {children}
    </View>
  );
}

function DevMagicLink({
  email,
  magicLink,
}: { email: string; magicLink: string }) {
  return (
    <AuthShell>
      <View className="w-full max-w-sm items-center p-8">
        <Text className="text-2xl font-bold mb-2 text-foreground">
          Your magic link
        </Text>
        <Text className="text-muted-foreground mb-4 text-center">
          Click the link below to sign in as {email}.
        </Text>
        <Link href={magicLink} asChild>
          <Button>Sign in →</Button>
        </Link>
        <Text className="mt-6 text-xs text-muted-foreground text-center">
          This link is shown here because direct login is enabled on this
          server.
        </Text>
      </View>
    </AuthShell>
  );
}

function CheckEmail({
  email,
  onReset,
}: { email: string; onReset: () => void }) {
  return (
    <AuthShell>
      <View className="w-full max-w-sm items-center p-8">
        <Text className="text-2xl font-bold mb-2 text-foreground">
          Check your email
        </Text>
        <Text className="text-muted-foreground mb-4 text-center">
          We sent a magic link to {email}. Click it to sign in.
        </Text>
        <Pressable onPress={onReset}>
          <Text className="text-sm underline text-muted-foreground">
            Use a different email
          </Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}

function LoginForm({
  email,
  loading,
  error,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  loading: boolean;
  error: Error | undefined;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
}) {
  return (
    <AuthShell>
      <View className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <Text className="text-2xl font-bold mb-1 text-foreground">
          Sign in to Auto Cal
        </Text>
        <Text className="text-sm text-muted-foreground mb-6">
          Enter your email and we'll send you a magic link.
        </Text>
        <FormElement onSubmit={onSubmit} className="gap-3">
          <Input
            value={email}
            onChangeText={onEmailChange}
            onSubmitEditing={onSubmit}
            placeholder="you@example.com"
          />
          {error && (
            <Text className="text-sm text-destructive">
              {error.message.replace('Unexpected error value: ', '')}
            </Text>
          )}
          <Button disabled={loading} onPress={onSubmit}>
            {loading ? 'Sending…' : 'Send magic link'}
          </Button>
        </FormElement>
      </View>
    </AuthShell>
  );
}
