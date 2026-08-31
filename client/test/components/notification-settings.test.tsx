import {
  NOTIFICATION_SETTINGS,
  NotificationSettings,
  UPDATE_NOTIFICATION_PREFERENCES,
} from '@/components/domain/settings/NotificationSettings';
// @vitest-environment jsdom
/**
 * The notification settings card. Rendered against a mocked Apollo link rather
 * than a live server, so what is under test is the component's own behaviour:
 * whether it hides itself when the server cannot push, and whether a toggle
 * actually sends what it says it does.
 */
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type Mocks, renderWithProviders } from '../support/render';

const PREFERENCES = {
  __typename: 'NotificationPreference' as const,
  id: 'prefs-1',
  enabled: true,
  leadTimeMinutes: 10,
  quietHoursStart: null,
  quietHoursEnd: null,
  activityTypeIds: [],
  habitDigest: true,
};

const ACTIVITY_TYPES = [
  {
    __typename: 'ActivityType' as const,
    id: 'at-1',
    name: 'Deep work',
    color: '#6366f1',
  },
];

function settingsMock(pushPublicKey: string | null) {
  return {
    request: { query: NOTIFICATION_SETTINGS },
    result: {
      data: {
        myPushPublicKey: pushPublicKey,
        myNotificationPreferences: PREFERENCES,
        myActivityTypes: ACTIVITY_TYPES,
      },
    },
  };
}

function renderCard(mocks: Mocks) {
  return renderWithProviders(<NotificationSettings />, mocks);
}

describe('NotificationSettings', () => {
  it('renders nothing while the query is in flight', () => {
    const { container } = renderCard([settingsMock('vapid-public-key')]);
    expect(container.textContent).toBe('');
  });

  it('shows the preferences once they load', async () => {
    renderCard([settingsMock('vapid-public-key')]);

    expect(await screen.findByText('Notifications')).toBeTruthy();
    expect(
      screen.getByText('Send reminders before scheduled tasks'),
    ).toBeTruthy();
    // The opt-in list is built from the caller's own activity types.
    expect(screen.getByText('Deep work')).toBeTruthy();
    expect(
      screen.getByText('Every activity type. Pick some to narrow it down.'),
    ).toBeTruthy();
  });

  it('stays hidden when the server has no VAPID keys', async () => {
    const { container } = renderCard([settingsMock(null)]);

    // Nothing to configure — a toggle that cannot deliver is worse than none.
    await waitFor(() => expect(container.textContent).toBe(''));
  });

  it('says push is web-only where the browser cannot subscribe', async () => {
    // jsdom has no serviceWorker or PushManager, which is the same shape as a
    // native build.
    renderCard([settingsMock('vapid-public-key')]);

    expect(
      await screen.findByText(/Browser notifications are only available/),
    ).toBeTruthy();
  });

  it('sends only the field a toggle changed', async () => {
    const updated = { ...PREFERENCES, habitDigest: false };
    let sentVariables: unknown;
    renderCard([
      settingsMock('vapid-public-key'),
      {
        request: {
          query: UPDATE_NOTIFICATION_PREFERENCES,
          variables: { input: { habitDigest: false } },
        },
        result: () => {
          sentVariables = { input: { habitDigest: false } };
          return { data: { myUpdateNotificationPreferences: updated } };
        },
      },
    ]);

    const label = await screen.findByText(
      'Show an in-app reminder for habits still due today',
    );
    label.click();

    await waitFor(() =>
      expect(sentVariables).toEqual({ input: { habitDigest: false } }),
    );
  });
});
