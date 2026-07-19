import { graphql } from '@/__generated__/index.js';
import { CalendarView } from '@/components/domain/dashboard/CalendarView';
import { ScheduleView } from '@/components/domain/dashboard/ScheduleView';
import { WeekNavigator } from '@/components/domain/dashboard/WeekNavigator';
import { Page, PageHeader } from '@/components/ui/page';
import { useSyncTimezone } from '@/hooks/useSyncTimezone';
import { isoDate, weekStart } from '@/lib/date';
import { useQuery } from '@apollo/client/react';
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';

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

const GET_MANUAL_EVENTS = graphql(`
  query GetManualEvents {
    myManualEvents {
      id
      ...ManualEvent_CalendarView
    }
  }
`);

type CalendarViewMode = 'day' | 'week' | 'month';

function resolveViewAndDate(params: {
  weekStart?: string;
  day?: string;
  view?: string;
}): { view: CalendarViewMode; date: Date } {
  // A date-only ISO string parses as local midnight, which is what the day and
  // week arithmetic below assumes.
  if (params.day) {
    return { view: 'day', date: parseISO(params.day) };
  }
  const view = (params.view as CalendarViewMode | undefined) ?? 'week';
  const anchor = params.weekStart
    ? parseISO(params.weekStart)
    : weekStart(new Date());
  if (view === 'month') return { view, date: startOfMonth(anchor) };
  return { view, date: weekStart(anchor) };
}

function navigateDate(date: Date, view: CalendarViewMode, dir: 1 | -1): Date {
  switch (view) {
    case 'day':
      return addDays(date, dir);
    case 'week':
      return weekStart(addWeeks(date, dir));
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
      const start = weekStart(date);
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
      return isoDate(date) === isoDate(now);
    case 'week':
      return weekStart(now).getTime() === weekStart(date).getTime();
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
    else setSearch({ view: 'week', weekStart: isoDate(weekStart(nextDate)) });
  }

  function handleViewChange(nextView: CalendarViewMode) {
    let nextDate = date;
    if (nextView === 'week') nextDate = weekStart(date);
    if (nextView === 'month') nextDate = startOfMonth(date);
    if (nextView === 'day') setSearch({ view: 'day', day: isoDate(nextDate) });
    else if (nextView === 'month')
      setSearch({ view: 'month', weekStart: isoDate(nextDate) });
    else setSearch({ view: 'week', weekStart: isoDate(weekStart(nextDate)) });
  }

  const clientTimezone = useSyncTimezone();

  const { data: calendarViewData } = useQuery(GET_CALENDAR_DATA, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: scheduleData } = useQuery(MY_SCHEDULE, {
    variables: {
      weekStart: isoDate(weekStart(date)),
      timezone: clientTimezone,
    },
  });

  // A manual event changes both the calendar overlay and the schedule layout.
  // Neither is refetched here: `useLiveUpdates` turns the server's
  // `manualEvent` signal into cache invalidation for both fields.
  const { data: manualEventsData } = useQuery(GET_MANUAL_EVENTS, {
    fetchPolicy: 'cache-and-network',
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
                  ? weekStart(new Date())
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
          manualEvents={manualEventsData?.myManualEvents ?? []}
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
