// @vitest-environment jsdom
/**
 * The Today route, end to end against a mocked Apollo link: the schedule query
 * it issues, what it renders for that data, and the mutations its buttons fire.
 *
 * expo-router is stubbed because the route is being rendered directly rather
 * than through a navigator — `Link` only has to produce something clickable,
 * and nothing under test navigates.
 */
import { screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/today',
}));

import { UpdateProfileTimezoneDocument } from '@/__generated__/graphql';
import { isoDate, weekStart } from '@/lib/date';
import TodayPage, { MY_TODAY } from '../../app/(app)/today';
import { type Mocks, renderWithProviders } from '../support/render';

/** Today at 09:00 local, which every assertion below is relative to. */
function at(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function scheduledItem(overrides: Record<string, unknown> = {}) {
  return {
    __typename: 'ScheduledItem' as const,
    kind: 'todo',
    id: 'todo-1',
    title: 'Write the report',
    priority: 3,
    estimatedLength: 30,
    isScheduled: true,
    scheduledStart: at(9),
    scheduledEnd: at(10),
    completedAt: null,
    unschedulableReason: null,
    activityType: {
      __typename: 'ActivityType' as const,
      id: 'at-1',
      name: 'Deep work',
      color: '#6366f1',
    },
    ...overrides,
  };
}

function scheduleMock(items: ReturnType<typeof scheduledItem>[]) {
  return {
    request: {
      query: MY_TODAY,
      variables: {
        weekStart: isoDate(weekStart(new Date())),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        mySchedule: items,
        myNotificationPreferences: {
          __typename: 'NotificationPreference' as const,
          id: 'prefs-1',
          // Off: the digest toast is its own test's subject, and leaving it on
          // would put a toast in front of every other assertion here.
          habitDigest: false,
        },
      },
    },
  };
}

/**
 * Every mount pushes the device timezone to the profile (`useSyncTimezone`).
 * Nothing here asserts on it, but an unmocked mutation is a link error and a
 * console dump on every test, so it is answered once and ignored.
 */
const timezoneMock = {
  request: {
    query: UpdateProfileTimezoneDocument,
    variables: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { myUpdateProfile: true } },
};

function renderToday(mocks: Mocks) {
  return renderWithProviders(<TodayPage />, [...(mocks ?? []), timezoneMock]);
}

describe('Today screen', () => {
  it('renders the day header before any data arrives', () => {
    renderToday([scheduleMock([])]);
    // By role, not by text: the day-picker also has a "Today" button.
    expect(screen.getByRole('heading', { name: 'Today' })).toBeTruthy();
  });

  it('explains itself when nothing is scheduled', async () => {
    renderToday([scheduleMock([])]);
    expect(
      await screen.findByText('Nothing scheduled for today.'),
    ).toBeTruthy();
  });

  it("lists today's items with their activity type", async () => {
    renderToday([scheduleMock([scheduledItem()])]);

    expect(await screen.findByText('Write the report')).toBeTruthy();
    // The row joins activity type, priority and length into one meta line.
    expect(screen.getByText(/Deep work/)).toBeTruthy();
  });

  it('leaves out items scheduled for another day', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    renderToday([
      scheduleMock([
        scheduledItem(),
        scheduledItem({
          id: 'todo-2',
          title: 'Tomorrow only',
          scheduledStart: tomorrow.toISOString(),
        }),
      ]),
    ]);

    expect(await screen.findByText('Write the report')).toBeTruthy();
    expect(screen.queryByText('Tomorrow only')).toBeNull();
  });

  it('leaves out items the scheduler could not place', async () => {
    renderToday([
      scheduleMock([
        scheduledItem(),
        scheduledItem({
          id: 'todo-3',
          title: 'No room for this',
          isScheduled: false,
          scheduledStart: null,
          scheduledEnd: null,
          unschedulableReason: 'No matching time block',
        }),
      ]),
    ]);

    expect(await screen.findByText('Write the report')).toBeTruthy();
    expect(screen.queryByText('No room for this')).toBeNull();
  });

  it('orders the day by start time, not by the order the server returned', async () => {
    renderToday([
      scheduleMock([
        scheduledItem({
          id: 'todo-late',
          title: 'Afternoon',
          scheduledStart: at(15),
          scheduledEnd: at(16),
        }),
        scheduledItem({ id: 'todo-early', title: 'Morning' }),
      ]),
    ]);

    await screen.findByText('Morning');
    const rendered = screen
      .getByText('Morning')
      .compareDocumentPosition(screen.getByText('Afternoon'));
    // DOCUMENT_POSITION_FOLLOWING
    expect(rendered & 4).toBeTruthy();
  });

  it('offers skip on a habit and not on a todo', async () => {
    renderToday([
      scheduleMock([
        scheduledItem(),
        scheduledItem({
          kind: 'habit',
          id: 'habit-1-0',
          title: 'Meditate',
          scheduledStart: at(11),
          scheduledEnd: at(11),
        }),
      ]),
    ]);

    await screen.findByText('Meditate');
    await waitFor(() =>
      expect(screen.getAllByLabelText(/skip/i)).toHaveLength(1),
    );
  });
});
