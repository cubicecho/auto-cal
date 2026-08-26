import type { ScheduledItem_ScheduleViewFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TodoForm } from '@/components/domain/todo/TodoForm';
import { Button } from '@/components/ui/button';
import { Page, PageHeader } from '@/components/ui/page';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useTodosUpdated } from '@/hooks/useTodosUpdated';
import { DERIVED, invalidate } from '@/lib/cache';
import { priorityLabel } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { addDays, format, isToday, parseISO } from 'date-fns';
import { Link } from 'expo-router';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Reuses the ScheduledItem_ScheduleView fragment defined in ScheduleView.tsx.
const MY_TODAY = graphql(`
  query MyToday($weekStart: String, $timezone: String) {
    mySchedule(weekStart: $weekStart, timezone: $timezone) {
      id
      ...ScheduledItem_ScheduleView
    }
  }
`);

const UPDATE_PROFILE = graphql(`
  mutation UpdateProfileFromToday($timezone: String!) {
    myUpdateProfile(timezone: $timezone)
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

const COMPLETE_TODO = graphql(`
  mutation CompleteTodoFromToday($id: ID!) {
    myCompleteTodo(id: $id) {
      __typename
      id
      completedAt
    }
  }
`);

function toMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function TodayPage() {
  const [todoOpen, setTodoOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const viewingToday = isToday(selectedDate);

  const [updateProfile] = useMutation(UPDATE_PROFILE);
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    updateProfile({ variables: { timezone: clientTimezone } }).catch(
      console.error,
    );
  }, []);

  const { data, refetch } = useQuery(MY_TODAY, {
    variables: {
      weekStart: format(toMonday(selectedDate), 'yyyy-MM-dd'),
      timezone: clientTimezone,
    },
    fetchPolicy: 'cache-and-network',
  });

  useTodosUpdated(() => {
    refetch().catch(console.error);
  });
  // The schedule also reflects habits and their time blocks.
  useDataChanged('habit', () => {
    refetch().catch(console.error);
  });
  useDataChanged('timeBlock', () => {
    refetch().catch(console.error);
  });

  const schedule = data?.mySchedule ?? [];
  const selectedKey = format(selectedDate, 'yyyy-MM-dd');

  const { today, unscheduledCount } = useMemo(() => {
    const items = schedule.filter(
      (i) =>
        i.isScheduled &&
        i.scheduledStart &&
        format(new Date(i.scheduledStart), 'yyyy-MM-dd') === selectedKey,
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
  const completing = completingHabit || completingTodo;

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

      <div className="mx-auto w-full max-w-2xl">
        <PageHeader
          title={viewingToday ? 'Today' : format(selectedDate, 'EEEE')}
          subtitle={format(selectedDate, 'EEEE, MMMM d')}
          actions={
            <Button size="sm" onClick={() => setTodoOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add todo
            </Button>
          }
        />

        <div className="mb-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            title="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={viewingToday}
            className="disabled:opacity-40"
            onClick={() => {
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
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            title="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-2 shadow-sm">
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <strong className="text-sm font-semibold">Your day</strong>
            <span className="text-xs text-muted-foreground">
              auto-scheduled
            </span>
          </div>

          {today.length === 0 ? (
            <div className="border-t px-3.5 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {viewingToday
                  ? 'Nothing scheduled for today.'
                  : `Nothing scheduled for ${format(selectedDate, 'EEEE, MMMM d')}.`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a todo or habit and assign it to an activity type with a
                matching time block.
              </p>
            </div>
          ) : (
            <div className="divide-y border-t">
              {today.map((item) => (
                <TodaySlot
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  onComplete={
                    completing ? undefined : () => handleComplete(item)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {unscheduledCount > 0 && (
          <Link
            href="/calendar"
            className="mt-3 flex items-center justify-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-500"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {unscheduledCount} item{unscheduledCount === 1 ? '' : 's'} couldn’t
            be scheduled — open the calendar
          </Link>
        )}
      </div>
    </Page>
  );
}

function TodaySlot({
  item,
  onComplete,
}: {
  item: ScheduledItem_ScheduleViewFragment;
  onComplete?: (() => void) | undefined;
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
    <div className="group flex items-center gap-3.5 px-3.5 py-3">
      <span className="w-11 shrink-0 font-mono text-xs text-muted-foreground">
        {startTime}
      </span>
      <span
        className="min-h-[2.25rem] w-1 shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: item.activityType?.color ?? '#94a3b8' }}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold leading-snug">
          {item.title}
        </span>
        <span className="truncate text-xs text-muted-foreground">{meta}</span>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          item.kind === 'habit'
            ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
            : 'bg-primary/15 text-primary'
        }`}
      >
        {item.kind}
      </span>
      {onComplete && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-green-600 group-hover:opacity-100"
          title={
            item.kind === 'habit' ? 'Mark habit complete' : 'Complete todo'
          }
          onClick={onComplete}
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
