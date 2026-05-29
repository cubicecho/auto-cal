import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useMutation, useQuery } from '@apollo/client/react';
import { Key, Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateApiKeyDialog } from './CreateApiKeyDialog';

const MY_API_KEYS = graphql(`
  query MyApiKeys {
    myApiKeys {
      id
      name
      keyPrefix
      scopes
      lastUsedAt
      expiresAt
      createdAt
    }
  }
`);

const MY_REVOKE_API_KEY = graphql(`
  mutation MyRevokeApiKey($id: ID!) {
    myRevokeApiKey(id: $id)
  }
`);

function formatRelative(dateVal: unknown): string {
  if (!dateVal) return 'never';
  const date = new Date(dateVal as string);
  if (Number.isNaN(date.getTime())) return 'never';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function formatDate(dateVal: unknown): string {
  if (!dateVal) return '—';
  const date = new Date(dateVal as string);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** drizzle-graphql serialises text[] columns as a JSON string; normalise to array. */
function parseScopes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    // Postgres array literal: {"read","write"} or JSON array: ["read","write"]
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {
      // ignore
    }
    // Postgres literal style: {read,write}
    if (raw.startsWith('{') && raw.endsWith('}')) {
      return raw
        .slice(1, -1)
        .split(',')
        .map((s) => s.replace(/^"|"$/g, '').trim());
    }
    return [raw];
  }
  return [];
}

export function ApiKeyManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, refetch } = useQuery(MY_API_KEYS);
  const [revokeApiKey, { loading: revoking }] = useMutation(MY_REVOKE_API_KEY, {
    refetchQueries: ['MyApiKeys'],
  });

  const keys = data?.myApiKeys ?? [];

  async function handleRevoke(id: string) {
    await revokeApiKey({ variables: { id } });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </CardTitle>
              <CardDescription className="mt-1">
                Personal API keys for headless integrations (e.g. Home
                Assistant). Use{' '}
                <code className="text-xs">
                  Authorization: Bearer &lt;token&gt;
                </code>{' '}
                on requests to <code className="text-xs">/graphql</code>.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Generate API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No API keys yet. Generate one to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => {
                const scopes = parseScopes(key.scopes);
                return (
                  <div
                    key={key.id}
                    className="flex items-start justify-between rounded-md border p-3 gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{key.name}</span>
                        <code className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                          acal_{key.keyPrefix}…
                        </code>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {scopes.map((scope) => (
                          <span
                            key={scope}
                            className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1.5 text-xs text-muted-foreground space-x-3">
                        <span>
                          Last used:{' '}
                          <span className="text-foreground">
                            {formatRelative(key.lastUsedAt)}
                          </span>
                        </span>
                        {key.expiresAt ? (
                          <span>
                            Expires:{' '}
                            <span className="text-foreground">
                              {formatDate(key.expiresAt)}
                            </span>
                          </span>
                        ) : null}
                        <span>
                          Created:{' '}
                          <span className="text-foreground">
                            {formatDate(key.createdAt)}
                          </span>
                        </span>
                      </div>
                      {scopes.includes('read') && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          iCal feeds available — use key token with{' '}
                          <code className="font-mono">/ical?secret=…</code>
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={revoking}
                      onClick={() => handleRevoke(key.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateApiKeyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          refetch();
        }}
      />
    </>
  );
}
