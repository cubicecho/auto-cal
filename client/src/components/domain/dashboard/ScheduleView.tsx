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
    <div className="flex flex-col gap-4 overflow-y-auto h-full">
      <TodoForm open={todoOpen} onOpenChange={setTodoOpen} />

      <Button size="sm" className="w-full" onPress={() => setTodoOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />
        Add todo
      </Button>

      {dayKeys.length === 0 && unscheduled.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          No tasks scheduled this week. Create todos or habits and assign them
          to an activity type.
        </p>
      )}

      {dayKeys.map((dayKey) => {
        const items = byDay.get(dayKey) ?? [];
        const date = parseISO(dayKey);
        const dayLabel = format(date, 'EEEE, MMM d');
        return (
          <div key={dayKey}>
            <SectionHeading variant="overline" className="mb-1.5">
              {dayLabel}
            </SectionHeading>
            <div className="flex flex-col gap-1.5">
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
            </div>
          </div>
        );
      })}

      {unscheduled.length > 0 && (
        <div>
          <SectionHeading
            variant="overline"
            className="mb-1.5 flex items-center gap-1.5"
          >
            <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />
            Unschedulable ({unscheduled.length})
          </SectionHeading>
          <div className="flex flex-col gap-1.5">
            {unscheduled.map((item) => (
              <ScheduleCard key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function unschedulableReason(item: ScheduledItem_ScheduleViewFragment): string {
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
    <div
      className={`flex items-start gap-2.5 rounded-md border bg-card px-3 py-2.5 ${
        !item.isScheduled ? 'border-amber-200 bg-amber-50/50' : ''
      }`}
    >
      <ColorDot
        color={item.activityType?.color ?? '#94a3b8'}
        className="mt-0.5 h-4 w-1"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium leading-snug">
            {item.title}
          </p>
          <div className="flex flex-shrink-0 items-center gap-1">
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
              <span className="text-xs text-muted-foreground">{timeRange}</span>
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
          </div>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">{item.kind}</span>
          <span>·</span>
          <span>{item.estimatedLength} min</span>
          <span>·</span>
          <span>{priorityLabel(item.priority)}</span>
          {item.activityType && (
            <>
              <span>·</span>
              <span>{item.activityType.name}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
