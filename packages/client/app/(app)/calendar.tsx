import { graphql } from '@/__generated__/index.js';
import { CalendarView } from '@/components/domain/dashboard/CalendarView';
import { ScheduleView } from '@/components/domain/dashboard/ScheduleView';
import { WeekNavigator } from '@/components/domain/dashboard/WeekNavigator';
import { Page, PageHeader } from '@/components/ui/page';
import { useTodosUpdated } from '@/hooks/useTodosUpdated';
import { useMutation, useQuery } from '@apollo/client/react';
import { addDays, addMonths, addWeeks, format, startOfMonth } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

const GET_CALENDAR_DATA = graphql(`
  query GetCalendarData {
    myTimeBlocks {
      id
      ...TimeBlock_CalendarView
    }
  }
`);

const MY_SCHEDULE = graphql(`
  query MySchedule($weekStart: String, $timezone: String) {
    mySchedule(weekStart: $weekStart, timezone: $timezone) {
      id
      ...ScheduledItem_CalendarView
      ...ScheduledItem_ScheduleView
    }
  }
`);

const UPDATE_PROFILE = graphql(`
  mutation UpdateProfile($timezone: String!) {
    myUpdateProfile(timezone: $timezone)
  }
`);

type CalendarViewMode = 'day' | 'week' | 'month';

function toMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  // biome-ignore lint/style/noNonNullAssertion: regex-validated input
  return new Date(y!, (m as number) - 1, d!);
}

function isoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function resolveViewAndDate(params: {
  weekStart?: string;
  day?: string;
  view?: string;
}): { view: CalendarViewMode; date: Date } {
  if (params.day) {
    return { view: 'day', date: parseISODate(params.day) };
  }
  const view = (params.view as CalendarViewMode | undefined) ?? 'week';
  const anchor = params.weekStart
    ? parseISODate(params.weekStart)
    : toMonday(new Date());
  if (view === 'month') return { view, date: startOfMonth(anchor) };
  return { view, date: toMonday(anchor) };
}

function navigateDate(date: Date, view: CalendarViewMode, dir: 1 | -1): Date {
  switch (view) {
    case 'day':
      return addDays(date, dir);
    case 'week':
      return toMonday(addWeeks(date, dir));
    case 'month':
      return startOfMonth(addMonths(date, dir));
  }
}

function dateLabel(date: Date, view: CalendarViewMode): string {
  const thisYear = new Date().getFullYear();
  switch (view) {
    case 'day':
      return date.getFullYear() === thisYear
        ? format(date, 'EEEE, MMM d')
        : format(date, 'EEEE, MMM d, yyyy');
    case 'week': {
      const start = toMonday(date);
      const end = addDays(start, 6);
      return end.getFullYear() === thisYear
        ? `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
        : `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    }
    case 'month':
      return format(
        date,
        date.getFullYear() === thisYear ? 'MMMM' : 'MMMM yyyy',
      );
  }
}

function isCurrent(date: Date, view: CalendarViewMode): boolean {
  const now = new Date();
  switch (view) {
    case 'day':
      return format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
    case 'week':
      return toMonday(now).getTime() === toMonday(date).getTime();
    case 'month':
      return format(date, 'yyyy-MM') === format(now, 'yyyy-MM');
  }
}

export default function CalendarPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    weekStart?: string;
    day?: string;
    view?: string;
  }>();

  const { view, date } = resolveViewAndDate(params);

  function setSearch(next: {
    weekStart?: string;
    day?: string;
    view?: string;
  }) {
    router.replace({ pathname: '/calendar', params: next });
  }

  function setDate(nextDate: Date) {
    if (view === 'day') setSearch({ view: 'day', day: isoDate(nextDate) });
    else if (view === 'month')
      setSearch({ view: 'month', weekStart: isoDate(nextDate) });
    else setSearch({ view: 'week', weekStart: isoDate(toMonday(nextDate)) });
  }

  function handleViewChange(nextView: CalendarViewMode) {
    let nextDate = date;
    if (nextView === 'week') nextDate = toMonday(date);
    if (nextView === 'month') nextDate = startOfMonth(date);
    if (nextView === 'day') setSearch({ view: 'day', day: isoDate(nextDate) });
    else if (nextView === 'month')
      setSearch({ view: 'month', weekStart: isoDate(nextDate) });
    else setSearch({ view: 'week', weekStart: isoDate(toMonday(nextDate)) });
  }

  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    updateProfile({ variables: { timezone: clientTimezone } }).catch(
      console.error,
    );
  }, []);

  const { data: calendarViewData } = useQuery(GET_CALENDAR_DATA, {
    fetchPolicy: 'cache-and-network',
  });

  const weekStart = toMonday(date);
  const { data: scheduleData, refetch: refetchSchedule } = useQuery(
    MY_SCHEDULE,
    {
      variables: {
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        timezone: clientTimezone,
      },
    },
  );

  // Refetch the schedule whenever any todo changes.
  useTodosUpdated(() => {
    refetchSchedule().catch(console.error);
  });

  return (
    <Page fill scroll={false} className="pt-4 pb-0">
      <PageHeader
        className="mb-3 flex-shrink-0"
        title="Calendar"
        subtitle="Your schedule at a glance"
        actions={
          <WeekNavigator
            date={date}
            view={view}
            dateLabel={dateLabel(date, view)}
            isCurrent={isCurrent(date, view)}
            onPrev={() => setDate(navigateDate(date, view, -1))}
            onNext={() => setDate(navigateDate(date, view, 1))}
            onToday={() =>
              setDate(
                view === 'week'
                  ? toMonday(new Date())
                  : view === 'month'
                    ? startOfMonth(new Date())
                    : new Date(),
              )
            }
            onViewChange={handleViewChange}
          />
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <CalendarView
          timeBlocks={calendarViewData?.myTimeBlocks ?? []}
          schedule={scheduleData?.mySchedule ?? []}
          date={date}
          view={view}
        />
        <ScheduleView
          schedule={scheduleData?.mySchedule ?? []}
          view={view}
          date={date}
        />
      </div>
    </Page>
  );
}
