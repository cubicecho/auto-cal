import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Copy } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@apollo/client/react';
import { useState } from 'react';

const MY_CREATE_API_KEY = graphql(`
  mutation MyCreateApiKey($input: MyCreateApiKeyInput!) {
    myCreateApiKey(input: $input) {
      apiKey {
        id
        name
        keyPrefix
        scopes
        createdAt
      }
      token
    }
  }
`);

type Phase = { phase: 'form' } | { phase: 'reveal'; token: string };

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const EXPIRY_OPTIONS = [
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
  { label: '1 year', value: '365' },
  { label: 'No expiry', value: '' },
] as const;

const ALL_SCOPES = ['read', 'write'] as const;

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateApiKeyDialogProps) {
  const [state, setState] = useState<Phase>({ phase: 'form' });
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read']);
  const [expiry, setExpiry] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [scopeError, setScopeError] = useState('');

  const [createApiKey, { loading }] = useMutation(MY_CREATE_API_KEY);

  function handleClose(value: boolean) {
    if (state.phase === 'reveal') {
      onCreated();
    }
    if (!value) {
      // Reset form state on close
      setState({ phase: 'form' });
      setName('');
      setScopes(['read']);
      setExpiry('');
      setCopied(false);
      setCopiedUrl(null);
      setNameError('');
      setScopeError('');
    }
    onOpenChange(value);
  }

  function toggleScope(scope: string) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
    setScopeError('');
  }

  // Optional event: Enter in the field raises the DOM submit, while the
  // Button is a Pressable and calls this directly.
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    let hasError = false;
    if (!name.trim()) {
      setNameError('Name is required');
      hasError = true;
    }
    if (scopes.length === 0) {
      setScopeError('Select at least one scope');
      hasError = true;
    }
    if (hasError) return;

    let expiresAt: string | undefined;
    if (expiry) {
      const d = new Date();
      d.setDate(d.getDate() + Number(expiry));
      const pad = (n: number) => n.toString().padStart(2, '0');
      expiresAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
    }

    const result = await createApiKey({
      variables: {
        input: {
          name: name.trim(),
          scopes,
          expiresAt,
        },
      },
    });

    const token = result.data?.myCreateApiKey?.token;
    if (token) {
      setState({ phase: 'reveal', token });
    }
  }

  function handleCopy(token: string) {
    const finish = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(token)
        .then(finish)
        .catch(() => {
          legacyCopy(token);
          finish();
        });
    } else {
      legacyCopy(token);
      finish();
    }
  }

  function handleCopyUrl(url: string) {
    const finish = () => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    };
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(finish)
        .catch(() => {
          legacyCopy(url);
          finish();
        });
    } else {
      legacyCopy(url);
      finish();
    }
  }

  function legacyCopy(text: string) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        {state.phase === 'form' ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Generate API Key</DialogTitle>
              <DialogDescription>
                Create a personal API key for headless integrations (e.g. Home
                Assistant). The full token is shown only once after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-name">Name</Label>
                <Input
                  id="api-key-name"
                  placeholder="e.g. Home Assistant"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setNameError('');
                  }}
                  maxLength={60}
                />
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Scopes</Label>
                <div className="flex gap-4">
                  {ALL_SCOPES.map((scope) => (
                    <label
                      key={scope}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={scopes.includes(scope)}
                        onChange={() => toggleScope(scope)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span className="text-sm capitalize">{scope}</span>
                    </label>
                  ))}
                </div>
                {scopeError && (
                  <p className="text-xs text-destructive">{scopeError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key-expiry">Expiry</Label>
                <select
                  id="api-key-expiry"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onPress={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                disabled={loading}
                onPress={() => {
                  void handleSubmit();
                }}
              >
                {loading ? 'Generating…' : 'Generate Key'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>API Key Generated</DialogTitle>
              <DialogDescription>
                Copy your token now — you won't be able to see it again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 dark:bg-amber-950 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  Store this token securely. It will not be shown again.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs font-mono">
                  {state.token}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() =>
                    state.phase === 'reveal' && handleCopy(state.token)
                  }
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {scopes.includes('read') && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    iCal feeds (copy now — token won't be shown again)
                  </p>
                  {[
                    {
                      label: 'Schedule',
                      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/ical?secret=${state.token}`,
                    },
                    {
                      label: 'Time Blocks',
                      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/ical?secret=${state.token}&view=blocks`,
                    },
                  ].map(({ label, url }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">
                        {label}
                      </span>
                      <code className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs font-mono">
                        {url}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => handleCopyUrl(url)}
                      >
                        {copiedUrl === url ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onPress={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
