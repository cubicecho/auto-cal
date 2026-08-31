import type { ScheduledItem_ScheduleViewFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TodoForm } from '@/components/domain/todo/TodoForm';
import { Button } from '@/components/ui/button';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  SkipForward,
  TriangleAlert,
} from '@/components/ui/icons';
import { Page, PageHeader } from '@/components/ui/page';
import { useHabitDigest } from '@/hooks/useHabitDigest';
import { useSyncTimezone } from '@/hooks/useSyncTimezone';
import { DERIVED, invalidate } from '@/lib/cache';
import { isoDate, weekStart } from '@/lib/date';
import { HOVER_REVEAL, cn, priorityLabel } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { addDays, format, isToday, parseISO } from 'date-fns';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

// Reuses the ScheduledItem_ScheduleView fragment defined in ScheduleView.tsx.
// `completedAt` is pulled in outside the fragment for the habit digest — the
// cards do not render it, so it does not belong to their fragment.
const MY_TODAY = graphql(`
  query MyToday($weekStart: String, $timezone: String) {
    mySchedule(weekStart: $weekStart, timezone: $timezone) {
      id
      completedAt
      ...ScheduledItem_ScheduleView
    }
    myNotificationPreferences {
      id
      habitDigest
    }
  }
`);

const COMPLETE_HABIT = graphql(`
  mutation CompleteHabitFromToday($input: CompleteHabitArgs!) {
    myCompleteHabit(input: $input) {
      __typename
      id
      completedAt
    }
  }
`);

// Declining today's instance. The row survives the scheduler's rewrite, so the
// slot is not simply handed back, and it leaves the completion rate alone.
const SKIP_HABIT = graphql(`
  mutation SkipHabitFromToday($input: SkipHabitArgs!) {
    mySkipHabit(input: $input) {
      __typename
      id
      skipped
      scheduledAt
    }
  }
`);

const COMPLETE_TODO = graphql(`
  mutation CompleteTodoFromToday($id: ID!) {
    myCompleteTodo(id: $id) {
      __typename
      id
      completedAt
    }
  }
`);

export default function TodayPage() {
  const [todoOpen, setTodoOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const clientTimezone = useSyncTimezone();
  const viewingToday = isToday(selectedDate);

  const { data } = useQuery(MY_TODAY, {
    variables: {
      weekStart: isoDate(weekStart(selectedDate)),
      timezone: clientTimezone,
    },
    fetchPolicy: 'cache-and-network',
  });

  const schedule = data?.mySchedule ?? [];
  const selectedKey = isoDate(selectedDate);

  const { today, unscheduledCount } = useMemo(() => {
    const items = schedule.filter(
      (i) =>
        i.isScheduled &&
        i.scheduledStart &&
        isoDate(new Date(i.scheduledStart)) === selectedKey,
    );
    items.sort(
      (a, b) =>
        new Date(a.scheduledStart ?? 0).getTime() -
        new Date(b.scheduledStart ?? 0).getTime(),
    );
    return {
      today: items,
      unscheduledCount: schedule.filter((i) => !i.isScheduled).length,
    };
  }, [schedule, selectedKey]);

  // Only on the day itself: paging to Thursday is not a reason to be told
  // what Thursday's habits are.
  useHabitDigest(
    today,
    viewingToday && (data?.myNotificationPreferences.habitDigest ?? false),
  );

  const [completeHabit, { loading: completingHabit }] = useMutation(
    COMPLETE_HABIT,
    {
      update: (cache) => invalidate(cache, ...DERIVED),
      onError: (err) => console.error('[completeHabit]', err.message),
    },
  );
  const [completeTodo, { loading: completingTodo }] = useMutation(
    COMPLETE_TODO,
    {
      update: (cache) => invalidate(cache, ...DERIVED),
      onError: (err) => console.error('[completeTodo]', err.message),
    },
  );
  const [skipHabit, { loading: skipping }] = useMutation(SKIP_HABIT, {
    update: (cache) => invalidate(cache, ...DERIVED),
    onError: (err) => console.error('[skipHabit]', err.message),
  });

  const completing = completingHabit || completingTodo || skipping;

  function handleSkip(item: ScheduledItem_ScheduleViewFragment) {
    skipHabit({
      variables: {
        input: {
          habitId: item.id.replace(/-\d+$/, ''),
          scheduledAt: item.scheduledStart ?? undefined,
        },
      },
    });
  }

  function handleComplete(item: ScheduledItem_ScheduleViewFragment) {
    const now = new Date().toISOString();
    if (item.kind === 'habit') {
      const habitId = item.id.replace(/-\d+$/, '');
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
    } else {
      completeTodo({
        variables: { id: item.id },
        optimisticResponse: {
          myCompleteTodo: { __typename: 'Todo', id: item.id, completedAt: now },
        },
      });
    }
  }

  return (
    <Page fill>
      <TodoForm open={todoOpen} onOpenChange={setTodoOpen} />

      <View className="mx-auto w-full max-w-2xl">
        <PageHeader
          title={viewingToday ? 'Today' : format(selectedDate, 'EEEE')}
          subtitle={format(selectedDate, 'EEEE, MMMM d')}
          actions={
            <Button size="sm" onPress={() => setTodoOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add todo
            </Button>
          }
        />

        <View className="mb-3 flex-row items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onPress={() => setSelectedDate((d) => addDays(d, -1))}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={viewingToday}
            className="disabled:opacity-40"
            onPress={() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              setSelectedDate(d);
            }}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => setSelectedDate((d) => addDays(d, 1))}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </View>

        <View className="rounded-xl border bg-card p-2 shadow-sm">
          <View className="flex-row items-center justify-between px-3.5 py-2.5">
            <Text className="text-sm font-semibold">Your day</Text>
            <Text className="text-xs text-muted-foreground">
              auto-scheduled
            </Text>
          </View>

          {today.length === 0 ? (
            <View className="border-t px-3.5 py-10 text-center">
              <Text className="text-sm text-muted-foreground">
                {viewingToday
                  ? 'Nothing scheduled for today.'
                  : `Nothing scheduled for ${format(selectedDate, 'EEEE, MMMM d')}.`}
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                Add a todo or habit and assign it to an activity type with a
                matching time block.
              </Text>
            </View>
          ) : (
            <View className="border-t border-border">
              {today.map((item) => (
                <TodaySlot
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  onComplete={
                    completing ? undefined : () => handleComplete(item)
                  }
                  onSkip={
                    !completing && item.kind === 'habit'
                      ? () => handleSkip(item)
                      : undefined
                  }
                />
              ))}
            </View>
          )}
        </View>

        {unscheduledCount > 0 && (
          <Link
            href="/calendar"
            className="mt-3 flex-row items-center justify-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-500"
          >
            <TriangleAlert className="h-3.5 w-3.5" />
            {unscheduledCount} item{unscheduledCount === 1 ? '' : 's'} couldn’t
            be scheduled — open the calendar
          </Link>
        )}
      </View>
    </Page>
  );
}

function TodaySlot({
  item,
  onComplete,
  onSkip,
}: {
  item: ScheduledItem_ScheduleViewFragment;
  onComplete?: (() => void) | undefined;
  onSkip?: (() => void) | undefined;
}) {
  const startTime = item.scheduledStart
    ? format(parseISO(item.scheduledStart), 'HH:mm')
    : '';
  const meta = [
    item.activityType?.name,
    priorityLabel(item.priority),
    `${item.estimatedLength} min`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="group flex-row items-center gap-3.5 border-b border-border px-3.5 py-3">
      <Text className="w-11 shrink-0 font-mono text-xs text-muted-foreground">
        {startTime}
      </Text>
      <View
        className="min-h-[2.25rem] w-1 shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: item.activityType?.color ?? '#94a3b8' }}
        aria-hidden
      />
      <View className="min-w-0 flex-1 flex-col">
        <Text className="truncate text-sm font-semibold leading-snug">
          {item.title}
        </Text>
        <Text className="truncate text-xs text-muted-foreground">{meta}</Text>
      </View>
      <Text
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          item.kind === 'habit'
            ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
            : 'bg-primary/15 text-primary'
        }`}
      >
        {item.kind}
      </Text>
      {onComplete && (
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            'h-7 w-7 text-muted-foreground hover:text-green-600',
            HOVER_REVEAL,
          )}
          aria-label={
            item.kind === 'habit' ? 'Mark habit complete' : 'Complete todo'
          }
          onPress={onComplete}
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
      {onSkip && (
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            'h-7 w-7 text-muted-foreground hover:text-amber-600',
            HOVER_REVEAL,
          )}
          aria-label={`Skip ${item.title}`}
          onPress={onSkip}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      )}
    </View>
  );
}
