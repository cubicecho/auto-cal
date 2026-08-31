import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Code } from '@/components/ui/code';
import { Key, Plus } from '@/components/ui/icons';
import { invalidate } from '@/lib/cache';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { Text, View } from 'react-native';
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

/**
 * drizzle-graphql returns `scopes` as a real `[String!]!` array as of v5, but
 * older API keys may still be read through a server that predates it. Kept as a
 * defensive normaliser; the array branch is the live path.
 */
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
    // `myApiKeys` hides revoked keys, so this is a membership change and the
    // revoked key's own fields say nothing about it.
    update: (cache) => invalidate(cache, 'myApiKeys'),
  });

  const keys = data?.myApiKeys ?? [];

  async function handleRevoke(id: string) {
    await revokeApiKey({ variables: { id } });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <View className="flex-row items-center justify-between">
            <View>
              <CardTitle className="flex-row items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </CardTitle>
              <CardDescription className="mt-1">
                Personal API keys for headless integrations (e.g. Home
                Assistant). Use{' '}
                <Code className="text-xs">
                  Authorization: Bearer &lt;token&gt;
                </Code>{' '}
                on requests to <Code className="text-xs">/graphql</Code>.
              </CardDescription>
            </View>
            <Button
              size="sm"
              variant="outline"
              onPress={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Generate API Key
            </Button>
          </View>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              No API keys yet. Generate one to get started.
            </Text>
          ) : (
            <View className="gap-3">
              {keys.map((key) => {
                const scopes = parseScopes(key.scopes);
                return (
                  <View
                    key={key.id}
                    className="flex-row items-start justify-between rounded-md border p-3 gap-4"
                  >
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="font-medium text-sm">{key.name}</Text>
                        <Code className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                          acal_{key.keyPrefix}…
                        </Code>
                      </View>
                      <View className="flex-row items-center gap-3 mt-1.5 flex-wrap">
                        {scopes.map((scope) => (
                          <Text
                            key={scope}
                            className="flex-row items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {scope}
                          </Text>
                        ))}
                      </View>
                      <View className="mt-1.5 text-xs text-muted-foreground gap-3">
                        <Text>
                          Last used:{' '}
                          <Text className="text-foreground">
                            {formatRelative(key.lastUsedAt)}
                          </Text>
                        </Text>
                        {key.expiresAt ? (
                          <Text>
                            Expires:{' '}
                            <Text className="text-foreground">
                              {formatDate(key.expiresAt)}
                            </Text>
                          </Text>
                        ) : null}
                        <Text>
                          Created:{' '}
                          <Text className="text-foreground">
                            {formatDate(key.createdAt)}
                          </Text>
                        </Text>
                      </View>
                      {scopes.includes('read') && (
                        <Text className="mt-1 text-xs text-muted-foreground">
                          iCal feeds available — use key token with{' '}
                          <Code className="font-mono">/ical?secret=…</Code>
                        </Text>
                      )}
                    </View>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={revoking}
                      onPress={() => handleRevoke(key.id)}
                    >
                      Revoke
                    </Button>
                  </View>
                );
              })}
            </View>
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
