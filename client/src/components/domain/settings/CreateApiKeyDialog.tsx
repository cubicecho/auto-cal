import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { Code } from '@/components/ui/code';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormElement } from '@/components/ui/form-element';
import { Check, Copy } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleChip } from '@/components/ui/toggle-chip';
import { copyText } from '@/lib/clipboard';
import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { Text, View } from 'react-native';

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

  // Called two ways: `FormElement` wires it to the DOM submit event on web
  // (Enter in the field), and the Button is a Pressable that calls it directly.
  async function handleSubmit() {
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

  async function handleCopy(token: string) {
    await copyText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyUrl(url: string) {
    await copyText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        {state.phase === 'form' ? (
          <FormElement onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Generate API Key</DialogTitle>
              <DialogDescription>
                Create a personal API key for headless integrations (e.g. Home
                Assistant). The full token is shown only once after creation.
              </DialogDescription>
            </DialogHeader>
            <View className="gap-4 py-4">
              <View className="gap-2">
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
                  <Text className="text-xs text-destructive">{nameError}</Text>
                )}
              </View>
              <View className="gap-2">
                <Label>Scopes</Label>
                <View className="flex-row gap-2">
                  {ALL_SCOPES.map((scope) => (
                    <ToggleChip
                      key={scope}
                      size="sm"
                      selected={scopes.includes(scope)}
                      onPress={() => toggleScope(scope)}
                      className="capitalize"
                    >
                      {scope}
                    </ToggleChip>
                  ))}
                </View>
                {scopeError && (
                  <Text className="text-xs text-destructive">{scopeError}</Text>
                )}
              </View>
              <View className="gap-2">
                <Label htmlFor="api-key-expiry">Expiry</Label>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger>
                    <SelectValue>
                      {EXPIRY_OPTIONS.find((o) => o.value === expiry)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>
            </View>
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
          </FormElement>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>API Key Generated</DialogTitle>
              <DialogDescription>
                Copy your token now — you won't be able to see it again.
              </DialogDescription>
            </DialogHeader>
            <View className="gap-4 py-4">
              <View className="rounded-md bg-amber-50 border border-amber-200 p-3 dark:bg-amber-950 dark:border-amber-800">
                <Text className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  Store this token securely. It will not be shown again.
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs font-mono">
                  {state.token}
                </Code>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    if (state.phase === 'reveal') void handleCopy(state.token);
                  }}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </View>
              {scopes.includes('read') && (
                <View className="gap-2">
                  <Text className="text-xs font-medium text-muted-foreground">
                    iCal feeds (copy now — token won't be shown again)
                  </Text>
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
                    <View key={label} className="flex-row items-center gap-2">
                      <Text className="text-xs text-muted-foreground w-20 shrink-0">
                        {label}
                      </Text>
                      <Code className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs font-mono">
                        {url}
                      </Code>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => void handleCopyUrl(url)}
                      >
                        {copiedUrl === url ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <DialogFooter>
              <Button onPress={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
