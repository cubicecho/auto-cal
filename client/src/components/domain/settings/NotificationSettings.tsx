import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Bell } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { SwitchField } from '@/components/ui/switch-field';
import { useToast } from '@/components/ui/toast';
import { ToggleChip } from '@/components/ui/toggle-chip';
import {
  currentEndpoint,
  permissionState,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

const NOTIFICATION_SETTINGS = graphql(`
  query NotificationSettings {
    myPushPublicKey
    myNotificationPreferences {
      id
      enabled
      leadTimeMinutes
      quietHoursStart
      quietHoursEnd
      activityTypeIds
      habitDigest
    }
    myActivityTypes {
      id
      name
      color
    }
  }
`);

const UPDATE_NOTIFICATION_PREFERENCES = graphql(`
  mutation MyUpdateNotificationPreferences(
    $input: UpdateNotificationPreferencesArgs!
  ) {
    myUpdateNotificationPreferences(input: $input) {
      id
      enabled
      leadTimeMinutes
      quietHoursStart
      quietHoursEnd
      activityTypeIds
      habitDigest
    }
  }
`);

const REGISTER_PUSH_SUBSCRIPTION = graphql(`
  mutation MyRegisterPushSubscription($input: RegisterPushSubscriptionArgs!) {
    myRegisterPushSubscription(input: $input)
  }
`);

const UNREGISTER_PUSH_SUBSCRIPTION = graphql(`
  mutation MyUnregisterPushSubscription($endpoint: String!) {
    myUnregisterPushSubscription(endpoint: $endpoint)
  }
`);

/** `1` – `120`, or null while the field is mid-edit and unparseable. */
function parseLeadTime(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value < 1 || value > 120) return null;
  return value;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function NotificationSettings() {
  const toast = useToast();
  const { data, loading } = useQuery(NOTIFICATION_SETTINGS);
  const [updatePreferences] = useMutation(UPDATE_NOTIFICATION_PREFERENCES);
  const [registerSubscription] = useMutation(REGISTER_PUSH_SUBSCRIPTION);
  const [unregisterSubscription] = useMutation(UNREGISTER_PUSH_SUBSCRIPTION);

  // This browser's own subscription state, which is not something the server
  // can answer: a user may have preferences enabled and still be reading this
  // on a second device that has never been granted permission.
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const prefs = data?.myNotificationPreferences;
  const publicKey = data?.myPushPublicKey ?? null;

  // Local echo for the two free-text fields so a half-typed value is not
  // round-tripped to the server on every keystroke.
  const [leadTime, setLeadTime] = useState('');
  const [quietStart, setQuietStart] = useState('');
  const [quietEnd, setQuietEnd] = useState('');

  useEffect(() => {
    if (!prefs) return;
    setLeadTime(String(prefs.leadTimeMinutes));
    setQuietStart(prefs.quietHoursStart ?? '');
    setQuietEnd(prefs.quietHoursEnd ?? '');
  }, [prefs]);

  useEffect(() => {
    let cancelled = false;
    currentEndpoint().then((endpoint) => {
      if (!cancelled) setSubscribed(!!endpoint);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to configure when the server has no VAPID keys — the card would
  // otherwise offer a toggle that can never deliver anything.
  if (loading || !prefs || !publicKey) return null;

  async function save(input: Record<string, unknown>) {
    try {
      await updatePreferences({ variables: { input } });
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Failed to save preferences',
      );
    }
  }

  async function handleEnable() {
    setBusy(true);
    try {
      const registration = await subscribeToPush(publicKey as string);
      if (!registration) {
        toast(
          permissionState() === 'denied'
            ? 'Notifications are blocked for this site in your browser settings.'
            : 'Notification permission was not granted.',
        );
        return;
      }
      await registerSubscription({ variables: { input: registration } });
      setSubscribed(true);
      toast('This browser will now receive reminders.', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to enable push');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    try {
      const endpoint = await unsubscribeFromPush();
      if (endpoint) await unregisterSubscription({ variables: { endpoint } });
      setSubscribed(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to disable push');
    } finally {
      setBusy(false);
    }
  }

  function commitLeadTime() {
    const value = parseLeadTime(leadTime);
    if (value === null) {
      setLeadTime(String(prefs?.leadTimeMinutes ?? 10));
      toast('Lead time must be between 1 and 120 minutes.');
      return;
    }
    if (value !== prefs?.leadTimeMinutes) save({ leadTimeMinutes: value });
  }

  function commitQuietHours() {
    // Both empty clears the window; one empty is not a window at all, so it is
    // held locally until the other is filled in rather than saved half-set.
    if (!quietStart && !quietEnd) {
      if (prefs?.quietHoursStart || prefs?.quietHoursEnd) {
        save({ quietHoursStart: null, quietHoursEnd: null });
      }
      return;
    }
    if (!HHMM.test(quietStart) || !HHMM.test(quietEnd)) return;
    if (
      quietStart !== prefs?.quietHoursStart ||
      quietEnd !== prefs?.quietHoursEnd
    ) {
      save({ quietHoursStart: quietStart, quietHoursEnd: quietEnd });
    }
  }

  const selected = new Set(prefs.activityTypeIds ?? []);
  function toggleActivityType(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    save({ activityTypeIds: [...next] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          A browser notification before a scheduled task starts, and an in-app
          reminder for habits still due today.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        {pushSupported() ? (
          <View className="flex-row items-center gap-3">
            <Button
              variant={subscribed ? 'outline' : 'default'}
              disabled={busy}
              onPress={subscribed ? handleDisable : handleEnable}
            >
              <Bell className="mr-2 h-4 w-4" />
              {subscribed
                ? 'Stop notifying this browser'
                : 'Notify me in this browser'}
            </Button>
            {subscribed ? (
              <Text className="text-sm text-muted-foreground">Registered</Text>
            ) : null}
          </View>
        ) : (
          <Text className="text-sm text-muted-foreground">
            Browser notifications are only available on the web app. Everything
            below still applies to any browser you have registered.
          </Text>
        )}

        <SwitchField
          id="notifications-enabled"
          label="Send reminders before scheduled tasks"
          checked={prefs.enabled}
          onCheckedChange={(checked) => save({ enabled: checked })}
        />

        <SwitchField
          id="notifications-habit-digest"
          label="Show an in-app reminder for habits still due today"
          checked={prefs.habitDigest}
          onCheckedChange={(checked) => save({ habitDigest: checked })}
        />

        <Field>
          <FieldLabel htmlFor="notifications-lead-time">Lead time</FieldLabel>
          <View className="w-24">
            <Input
              id="notifications-lead-time"
              type="number"
              min={1}
              max={120}
              value={leadTime}
              onChangeText={setLeadTime}
              onBlur={commitLeadTime}
              onSubmitEditing={commitLeadTime}
            />
          </View>
          <FieldDescription>
            Minutes before a task starts. 1 to 120.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="notifications-quiet-start">
            Quiet hours
          </FieldLabel>
          <View className="flex-row items-center gap-2">
            <View className="w-28">
              <Input
                id="notifications-quiet-start"
                type="time"
                value={quietStart}
                onChangeText={setQuietStart}
                onBlur={commitQuietHours}
              />
            </View>
            <Text className="text-sm text-muted-foreground">to</Text>
            <View className="w-28">
              <Input
                id="notifications-quiet-end"
                type="time"
                value={quietEnd}
                onChangeText={setQuietEnd}
                onBlur={commitQuietHours}
              />
            </View>
          </View>
          <FieldDescription>
            Nothing is sent inside this window. Leave both empty for none; it
            may wrap past midnight.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Activity types</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {data.myActivityTypes.map((type) => (
              <ToggleChip
                key={type.id}
                size="sm"
                selected={selected.has(type.id)}
                onPress={() => toggleActivityType(type.id)}
                {...(selected.has(type.id) && type.color
                  ? { backgroundColor: type.color }
                  : {})}
              >
                {type.name}
              </ToggleChip>
            ))}
          </View>
          <FieldDescription>
            {selected.size === 0
              ? 'Every activity type. Pick some to narrow it down.'
              : `Only these ${selected.size} type${selected.size === 1 ? '' : 's'}.`}
          </FieldDescription>
        </Field>
      </CardContent>
    </Card>
  );
}
