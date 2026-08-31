import type { ScheduledItem_ScheduleViewFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TodoForm } from '@/components/domain/todo/TodoForm';
import { Button } from '@/components/ui/button';
import { ColorDot } from '@/components/ui/color-dot';
import { Check, Plus, TriangleAlert } from '@/components/ui/icons';
import { SectionHeading } from '@/components/ui/section-heading';
import { useToast } from '@/components/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DERIVED, invalidate } from '@/lib/cache';
import { isoDate } from '@/lib/date';
import { priorityLabel } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import {
  addDays,
  endOfDay,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

graphql(`
  fragment ScheduledItem_ScheduleView on ScheduledItem {
    kind
    id
    title
    priority
    estimatedLength
    isScheduled
    scheduledStart
    scheduledEnd
    unschedulableReason
    activityType {
      id
      name
      color
    }
  }
`);

const COMPLETE_HABIT = graphql(`
  mutation CompleteHabitFromSchedule($input: CompleteHabitArgs!) {
    myCompleteHabit(input: $input) {
      __typename
      id
      completedAt
    }
  }
`);

const COMPLETE_TODO = graphql(`
  mutation CompleteTodoFromSchedule($id: ID!) {
    myCompleteTodo(id: $id) {
      __typename
      id
      completedAt
    }
  }
`);

function groupByDay(
  items: ScheduledItem_ScheduleViewFragment[],
): Map<string, ScheduledItem_ScheduleViewFragment[]> {
  const map = new Map<string, ScheduledItem_ScheduleViewFragment[]>();
  for (const item of items) {
    if (!item.scheduledStart) continue;
    // Parse as UTC ISO string and format to local "YYYY-MM-DD" for grouping
    const dayKey = isoDate(new Date(item.scheduledStart));
    const existing = map.get(dayKey) ?? [];
    existing.push(item);
    map.set(dayKey, existing);
  }
  for (const [key, dayItems] of map) {
    map.set(
      key,
      dayItems.sort(
        (a, b) =>
          new Date(a.scheduledStart ?? 0).getTime() -
          new Date(b.scheduledStart ?? 0).getTime(),
      ),
    );
  }
  return map;
}

type CalendarViewMode = 'day' | 'week' | 'month';

type ScheduleViewProps = {
  schedule: Array<ScheduledItem_ScheduleViewFragment>;
  view: CalendarViewMode;
  date: Date;
};

function viewWindow(
  view: CalendarViewMode,
  date: Date,
): { start: Date; end: Date } {
  switch (view) {
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date) };
    case 'month':
      return { start: startOfMonth(date), end: endOfMonth(date) };
    default: {
      // week starts on Monday
      const d = new Date(date);
      const day = d.getDay();
      const monday = addDays(d, day === 0 ? -6 : 1 - day);
      return { start: startOfDay(monday), end: endOfDay(addDays(monday, 6)) };
    }
  }
}

export function ScheduleView({ schedule, view, date }: ScheduleViewProps) {
  const toast = useToast();
  const [todoOpen, setTodoOpen] = useState(false);

  const { start: windowStart, end: windowEnd } = useMemo(
    () => viewWindow(view, date),
    [view, date],
  );

  const { scheduled, unscheduled } = useMemo(() => {
    const inWindow = (item: ScheduledItem_ScheduleViewFragment) => {
      if (!item.scheduledStart) return false;
      const d = parseISO(item.scheduledStart);
      return d >= windowStart && d <= windowEnd;
    };
    return {
      scheduled: schedule.filter((i) => i.isScheduled && inWindow(i)),
      unscheduled: schedule.filter((i) => !i.isScheduled),
    };
  }, [schedule, windowStart, windowEnd]);

  const byDay = useMemo(() => groupByDay(scheduled), [scheduled]);
  const dayKeys = useMemo(() => [...byDay.keys()].sort(), [byDay]);

  const [completeHabit, { loading: completingHabit }] = useMutation(
    COMPLETE_HABIT,
    {
      update: (cache) => invalidate(cache, ...DERIVED),
      onError: (err) => toast(err.message || 'Could not complete this habit'),
    },
  );

  const [completeTodo, { loading: completingTodo }] = useMutation(
    COMPLETE_TODO,
    {
      update: (cache) => invalidate(cache, ...DERIVED),
      onError: (err) => toast(err.message || 'Could not complete this todo'),
    },
  );

  const completing = completingHabit || completingTodo;

  function handleCompleteHabit(item: ScheduledItem_ScheduleViewFragment) {
    const habitId = item.id.replace(/-\d+$/, '');
    const now = new Date().toISOString();
    completeHabit({
      variables: {
        input: { habitId, scheduledAt: item.scheduledStart ?? undefined },
      },
      optimisticResponse: {
        myCompleteHabit: {
          __typename: 'HabitCompletion',
          id: `${item.id}-optimistic`,
          completedAt: now,
        },
      },
    });
  }

  function handleCompleteTodo(item: ScheduledItem_ScheduleViewFragment) {
    const now = new Date().toISOString();
    completeTodo({
      variables: { id: item.id },
      optimisticResponse: {
        myCompleteTodo: { __typename: 'Todo', id: item.id, completedAt: now },
      },
    });
  }

  return (
    <ScrollView className="h-full" contentContainerClassName="flex-col gap-4">
      <TodoForm open={todoOpen} onOpenChange={setTodoOpen} />

      <Button size="sm" className="w-full" onPress={() => setTodoOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />
        Add todo
      </Button>

      {dayKeys.length === 0 && unscheduled.length === 0 && (
        <Text className="text-muted-foreground text-sm text-center py-8">
          No tasks scheduled this week. Create todos or habits and assign them
          to an activity type.
        </Text>
      )}

      {dayKeys.map((dayKey) => {
        const items = byDay.get(dayKey) ?? [];
        const date = parseISO(dayKey);
        const dayLabel = format(date, 'EEEE, MMM d');
        return (
          <View key={dayKey}>
            <SectionHeading variant="overline" className="mb-1.5">
              {dayLabel}
            </SectionHeading>
            <View className="flex-col gap-1.5">
              {items.map((item) => (
                <ScheduleCard
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  onComplete={
                    completing
                      ? undefined
                      : item.kind === 'habit'
                        ? () => handleCompleteHabit(item)
                        : () => handleCompleteTodo(item)
                  }
                />
              ))}
            </View>
          </View>
        );
      })}

      {unscheduled.length > 0 && (
        <View>
          <SectionHeading
            variant="overline"
            className="mb-1.5 flex-row items-center gap-1.5"
          >
            <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />
            Unschedulable ({unscheduled.length})
          </SectionHeading>
          <View className="flex-col gap-1.5">
            {unscheduled.map((item) => (
              <ScheduleCard key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const UNSCHEDULABLE_REASON_TEXT: Record<string, string> = {
  'no-activity-type': 'No activity type — assign this todo’s list to one',
  'no-time-block': 'No matching time block — add one for this activity type',
  'no-capacity':
    'No free slot is long enough — add capacity or shorten the estimate',
  'past-due':
    'Can’t finish before its due date — extend the due date or add earlier time blocks',
  'gap-constraint': 'Blocked by the minimum spacing between instances',
  'invalid-length': 'Estimated length must be greater than zero',
};

function unschedulableReason(item: ScheduledItem_ScheduleViewFragment): string {
  const code = item.unschedulableReason;
  if (code && UNSCHEDULABLE_REASON_TEXT[code])
    return UNSCHEDULABLE_REASON_TEXT[code];
  if (!item.activityType) return 'No activity type assigned';
  return 'No available slot — add a matching time block or reduce the estimated length';
}

function ScheduleCard({
  item,
  onComplete,
}: {
  item: ScheduledItem_ScheduleViewFragment;
  onComplete?: (() => void) | undefined;
}) {
  const timeRange =
    item.scheduledStart && item.scheduledEnd
      ? `${format(parseISO(item.scheduledStart), 'h:mm a')} – ${format(parseISO(item.scheduledEnd), 'h:mm a')}`
      : null;

  return (
    <View
      className={`flex-row items-start gap-2.5 rounded-md border bg-card px-3 py-2.5 ${
        !item.isScheduled ? 'border-amber-200 bg-amber-50/50' : ''
      }`}
    >
      <ColorDot
        color={item.activityType?.color ?? '#94a3b8'}
        className="mt-0.5 h-4 w-1"
      />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="truncate text-sm font-medium leading-snug">
            {item.title}
          </Text>
          <View className="flex-row flex-shrink-0 items-center gap-1">
            {!item.isScheduled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/time-blocks"
                    className="text-amber-500 hover:text-amber-600"
                  >
                    <TriangleAlert className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{unschedulableReason(item)}</TooltipContent>
              </Tooltip>
            )}
            {timeRange && (
              <Text className="text-xs text-muted-foreground">{timeRange}</Text>
            )}
            {onComplete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-green-600"
                aria-label="Mark habit complete"
                onPress={onComplete}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
          </View>
        </View>
        <View className="mt-0.5 flex-row items-center gap-2 text-xs text-muted-foreground">
          <Text className="capitalize">{item.kind}</Text>
          <Text>·</Text>
          <Text>{item.estimatedLength} min</Text>
          <Text>·</Text>
          <Text>{priorityLabel(item.priority)}</Text>
          {item.activityType && (
            <>
              <Text>·</Text>
              <Text>{item.activityType.name}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
