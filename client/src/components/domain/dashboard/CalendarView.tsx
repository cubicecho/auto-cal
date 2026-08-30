/**
 * The native calendar: a themed agenda, one section per day in the visible
 * range, showing the day's time blocks above the events scheduled inside them.
 *
 * `CalendarView.web.tsx` is FullCalendar — a drag-and-drop time grid built on
 * pointer events and absolute pixel offsets, none of which has a native
 * counterpart worth reproducing. An agenda is what a calendar looks like on a
 * phone, and it answers the same question ("what is on, and when") without a
 * second calendar library.
 *
 * `date` and `view` come from the same navigator the web grid uses, so the two
 * platforms always show the same span.
 */
import type {
  ManualEvent_CalendarViewFragment,
  ScheduledItem_CalendarViewFragment,
  TimeBlock_CalendarViewFragment,
} from '@/__generated__/graphql.js';
import { ColorDot } from '@/components/ui/color-dot';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ScrollView, Text, View } from 'react-native';

interface Props {
  timeBlocks: readonly TimeBlock_CalendarViewFragment[];
  schedule: readonly ScheduledItem_CalendarViewFragment[];
  manualEvents: readonly ManualEvent_CalendarViewFragment[];
  date: Date;
  view: 'day' | 'week' | 'month';
}

/** The span the agenda covers, matching what the web grid would render. */
function visibleDays(date: Date, view: Props['view']): Date[] {
  if (view === 'day') return [date];
  if (view === 'week') {
    return eachDayOfInterval({
      start: startOfWeek(date),
      end: endOfWeek(date),
    });
  }
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });
}

/**
 * The `DateTime` scalar is generated as `unknown` (codegen has no mapping for
 * it), so every timestamp off a fragment has to be narrowed here rather than
 * asserted at each use.
 */
function asDate(value: unknown): Date | null {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** One row in a day section — an event or a scheduled todo/habit. */
function AgendaRow({
  title,
  start,
  end,
  color,
}: {
  title: string;
  start: Date | null;
  end: Date | null;
  color: string | null | undefined;
}) {
  return (
    <View className="mb-2 flex-row items-center gap-2 rounded-md border border-border bg-card p-3">
      {color ? <ColorDot color={color} /> : null}
      <View className="flex-1">
        <Text className="font-medium text-card-foreground">{title}</Text>
        {start ? (
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {format(start, 'HH:mm')}
            {end ? ` – ${format(end, 'HH:mm')}` : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function CalendarView({
  timeBlocks,
  schedule,
  manualEvents,
  date,
  view,
}: Props) {
  const days = visibleDays(date, view);

  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        {days.map((day) => {
          // `daysOfWeek` is stored the way `Date.getDay()` reports it.
          const blocks = timeBlocks.filter((block) =>
            block.daysOfWeek.includes(day.getDay()),
          );
          const events = manualEvents.flatMap((event) => {
            const start = asDate(event.startAt);
            return start && isSameDay(start, day)
              ? [{ event, start, end: asDate(event.endAt) }]
              : [];
          });
          const scheduled = schedule.flatMap((item) => {
            const start = asDate(item.scheduledStart);
            return start && isSameDay(start, day)
              ? [{ item, start, end: asDate(item.scheduledEnd) }]
              : [];
          });

          // A month agenda listing every empty day is mostly blank space; a
          // single-day view still has to say that the day is empty.
          const empty = blocks.length + events.length + scheduled.length === 0;
          if (empty && view === 'month') return null;

          const rows = [
            ...events.map(({ event, start, end }) => ({
              key: `event-${event.id}`,
              title: event.title,
              start,
              end,
              color: event.color,
            })),
            ...scheduled.map(({ item, start, end }) => ({
              key: `item-${item.kind}-${item.id}`,
              title: item.title,
              start,
              end,
              color: item.activityType?.color,
            })),
          ].sort((a, b) => a.start.getTime() - b.start.getTime());

          return (
            <View key={day.toISOString()} className="mb-6">
              <Text className="mb-2 text-base font-semibold text-foreground">
                {format(day, view === 'day' ? 'EEEE, d MMMM' : 'EEE d MMM')}
              </Text>

              {blocks.length > 0 ? (
                <View className="mb-2 flex-row flex-wrap gap-2">
                  {blocks.map((block) => (
                    <View
                      key={block.id}
                      className="flex-row items-center gap-1.5 rounded-full bg-muted px-2 py-1"
                    >
                      {block.activityType ? (
                        <ColorDot color={block.activityType.color} />
                      ) : null}
                      <Text className="text-xs text-muted-foreground">
                        {block.activityType?.name ?? 'Any'} {block.startTime}–
                        {block.endTime}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {rows.map((row) => (
                <AgendaRow
                  key={row.key}
                  title={row.title}
                  start={row.start}
                  end={row.end}
                  color={row.color}
                />
              ))}

              {empty ? (
                <Text className="text-sm text-muted-foreground">
                  Nothing scheduled.
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
