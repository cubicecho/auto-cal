import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { useMutation } from '@apollo/client/react';
import { type SubmitEvent, useState } from 'react';

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

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
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

function DevMagicLink({
  email,
  magicLink,
}: { email: string; magicLink: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center max-w-sm p-8">
        <h1 className="text-2xl font-bold mb-2">Your magic link</h1>
        <p className="text-muted-foreground mb-4">
          Click the link below to sign in as <strong>{email}</strong>.
        </p>
        <a
          href={magicLink}
          className="break-all rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign in →
        </a>
        <p className="mt-6 text-xs text-muted-foreground">
          This link is shown here because the server is running in development
          mode.
        </p>
      </div>
    </div>
  );
}

function CheckEmail({
  email,
  onReset,
}: { email: string; onReset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center max-w-sm p-8">
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-4">
          We sent a magic link to <strong>{email}</strong>. Click it to sign in.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-sm underline text-muted-foreground"
        >
          Use a different email
        </button>
      </div>
    </div>
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
  onSubmit: (e: SubmitEvent) => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">Sign in to Auto Cal</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your email and we'll send you a magic link.
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && (
            <p className="text-sm text-destructive">
              {error.message.replace('Unexpected error value: ', '')}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send magic link'}
          </Button>
        </form>
      </div>
    </div>
  );
}
