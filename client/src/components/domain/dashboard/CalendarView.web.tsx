import type {
  ScheduledItem_CalendarViewFragment,
  TimeBlock_CalendarViewFragment,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { useToast } from '@/components/ui/toast';
import { DERIVED, invalidate } from '@/lib/cache';
import { weekStart } from '@/lib/date';
import { useMutation } from '@apollo/client/react';
import {
  addDays,
  format,
  getDay,
  parse,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { Check, Loader2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => weekStart(new Date()),
  getDay,
  locales,
});

// Create DnD-enabled Calendar
// biome-ignore lint/suspicious/noExplicitAny: react-big-calendar DnD wrapper lacks proper generic types
const wdnd: any = (withDragAndDrop as any).default ?? withDragAndDrop;
// biome-ignore lint/suspicious/noExplicitAny: react-big-calendar DnD wrapper lacks proper generic types
const DnDCalendar = wdnd(Calendar as any) as any;

// ─── GraphQL ────────────────────────────────────────────────────────────────

graphql(`
  fragment TimeBlock_CalendarView on TimeBlock {
    id
    daysOfWeek
    startTime
    endTime
    activityType {
      id
      name
      color
    }
  }

  fragment ScheduledItem_CalendarView on ScheduledItem {
    kind
    id
    title
    isScheduled
    isOverdue
    scheduledStart
    scheduledEnd
    completedAt
    activityType {
      id
      name
      color
    }
  }
`);

const PIN_TODO = graphql(`
  mutation PinTodo($input: UpdateTodoArgs!) {
    myUpdateTodo(input: $input) { id scheduledAt manuallyScheduled }
  }
`);

const COMPLETE_HABIT = graphql(`
  mutation CompleteHabitFromCalendar($input: CompleteHabitArgs!) {
    myCompleteHabit(input: $input) { __typename id completedAt }
  }
`);

const COMPLETE_TODO = graphql(`
  mutation CompleteTodoFromCalendar($id: ID!) {
    myCompleteTodo(id: $id) { __typename id completedAt }
  }
`);

// ─── Types ──────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  isTask?: boolean;
  isPast?: boolean;
  isCompleted?: boolean;
  kind?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

function darkenColor(hex: string): string {
  if (!hex.startsWith('#')) return hex;
  const n = Number.parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - 40);
  const g = Math.max(0, ((n >> 8) & 0xff) - 40);
  const b = Math.max(0, (n & 0xff) - 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function desaturateColor(hex: string, amount = 0.2): string {
  if (!hex.startsWith('#')) return hex;
  const n = Number.parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const grey = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const nr = Math.round(grey + (r - grey) * amount);
  const ng = Math.round(grey + (g - grey) * amount);
  const nb = Math.round(grey + (b - grey) * amount);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function expandTimeBlock(
  block: TimeBlock_CalendarViewFragment,
  referenceDate: Date,
): CalendarEvent[] {
  if (!block.activityType) return [];
  const monday = weekStart(referenceDate);
  const { hours: startH, minutes: startM } = parseTime(block.startTime);
  const { hours: endH, minutes: endM } = parseTime(block.endTime);
  const title = block.activityType.name;
  const color = block.activityType.color;

  return block.daysOfWeek.map((dayIndex: number) => {
    // dayIndex: 0=Sun, 1=Mon…6=Sat.
    // offset from Monday: Mon=0, Tue=1…Sat=5, Sun=6
    const offsetFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
    const dayDate = addDays(monday, offsetFromMonday);
    const start = setMinutes(setHours(startOfDay(dayDate), startH), startM);
    const end = setMinutes(setHours(startOfDay(dayDate), endH), endM);
    return {
      id: `${block.id}-${dayIndex}`,
      title,
      start,
      end,
      color,
    };
  });
}

// ─── Event Style ─────────────────────────────────────────────────────────────

function eventStyleGetter(event: CalendarEvent) {
  const bgColor = event.isPast ? desaturateColor(event.color) : event.color;

  if (event.isTask) {
    return {
      style: {
        backgroundColor: bgColor,
        borderColor: event.isPast
          ? desaturateColor(darkenColor(event.color))
          : darkenColor(event.color),
        color: event.isPast ? '#aaa' : '#fff',
        borderRadius: '4px',
        border: `2px solid ${event.isPast ? desaturateColor(darkenColor(event.color)) : darkenColor(event.color)}`,
        opacity: 1,
        fontWeight: event.isCompleted ? 400 : 600,
        fontSize: '0.75rem',
        zIndex: 10,
        textDecoration: event.isCompleted ? 'line-through' : 'none',
        fontStyle: event.isCompleted ? 'italic' : 'normal',
      },
    };
  }

  return {
    style: {
      backgroundColor: bgColor,
      borderColor: bgColor,
      color: event.isPast ? '#999' : '#fff',
      borderRadius: '4px',
      border: 'none',
      opacity: 0.85,
      fontWeight: 500,
      fontSize: '0.8rem',
    },
  };
}

// ─── Custom Event Component ──────────────────────────────────────────────────

function CalendarEventComponent({ event }: { event: CalendarEvent }) {
  const toast = useToast();

  // These fire optimistically, so a rejection silently rolls the event back to
  // where it was — the toast is the only sign anything happened.
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
  const isHabit = event.isTask && event.kind === 'habit';
  const isTodo = event.isTask && event.kind === 'todo';

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const now = new Date().toISOString();
    if (isHabit) {
      const raw = event.id.replace(/^scheduled-habit-/, '');
      const habitId = raw.replace(/-\d+$/, '');
      completeHabit({
        variables: {
          input: {
            habitId,
            scheduledAt: format(event.start, "yyyy-MM-dd'T'HH:mm:ss"),
          },
        },
        optimisticResponse: {
          myCompleteHabit: {
            __typename: 'HabitCompletion',
            id: `${event.id}-optimistic`,
            completedAt: now,
          },
        },
      }).catch(() => {});
    } else if (isTodo) {
      const todoId = event.id.replace(/^scheduled-todo-/, '');
      completeTodo({
        variables: { id: todoId },
        optimisticResponse: {
          myCompleteTodo: { __typename: 'Todo', id: todoId, completedAt: now },
        },
      }).catch(() => {});
    }
  }

  return (
    <div
      className="flex h-full items-center justify-between gap-1 overflow-hidden px-0.5"
      style={{ opacity: completing ? 0.5 : 1, transition: 'opacity 150ms' }}
    >
      <span className="truncate text-xs leading-tight">{event.title}</span>
      {(isHabit || isTodo) && (
        <button
          type="button"
          disabled={completing}
          className="flex-shrink-0 rounded p-0.5 opacity-80 hover:opacity-100 hover:bg-black/20 disabled:cursor-not-allowed"
          title={isHabit ? 'Mark habit complete' : 'Mark todo complete'}
          onClick={handleClick}
        >
          {completing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type CalendarViewMode = 'day' | 'week' | 'month';

type CalendarViewProps = {
  timeBlocks: Array<TimeBlock_CalendarViewFragment>;
  schedule: Array<ScheduledItem_CalendarViewFragment>;
  date: Date;
  view: CalendarViewMode;
};

export function CalendarView({
  timeBlocks,
  schedule,
  date,
  view,
}: CalendarViewProps) {
  const toast = useToast();

  const [pinTodo] = useMutation(PIN_TODO, {
    update: (cache) => invalidate(cache, ...DERIVED),
    // A refused drag snaps the event back to where it started, which on its own
    // is indistinguishable from the drop not registering.
    onError: (err) => toast(err.message || 'Could not move this todo'),
  });

  const backgroundEvents = useMemo<CalendarEvent[]>(() => {
    const now = new Date();
    // Skip background time-block shading in month view — too noisy on a grid
    if (view === 'month') return [];
    return timeBlocks.flatMap((block) =>
      expandTimeBlock(block, date).map((event) => ({
        ...event,
        isPast: event.end < now,
      })),
    );
  }, [timeBlocks, date, view]);

  const scheduledEvents = useMemo<CalendarEvent[]>(() => {
    const now = new Date();
    return schedule
      .filter((item) => {
        if (!item.isScheduled || !item.scheduledStart || !item.scheduledEnd)
          return false;
        // Don't show incomplete events that have already ended
        return new Date(item.scheduledEnd) > now;
      })
      .map((item) => {
        const kindPrefix = item.kind === 'todo' ? '✓ ' : '↻ ';
        return {
          id: `scheduled-${item.kind}-${item.id}`,
          title: `${kindPrefix}${item.title}`,
          kind: item.kind,
          start: new Date(item.scheduledStart as string),
          end: new Date(item.scheduledEnd as string),
          color: item.activityType?.color ?? '#64748b',
          isTask: true,
        };
      });
  }, [schedule]);

  const completedEvents = useMemo<CalendarEvent[]>(() => {
    return schedule
      .filter(
        (item) =>
          item.kind === 'todo' &&
          item.completedAt &&
          item.scheduledStart &&
          item.scheduledEnd,
      )
      .map((item) => {
        const start = new Date(item.completedAt as string);
        const scheduledStart = new Date(item.scheduledStart as string);
        const scheduledEnd = new Date(item.scheduledEnd as string);
        const durationMs = scheduledEnd.getTime() - scheduledStart.getTime();
        return {
          id: `completed-todo-${item.id}`,
          title: `✓ ${item.title}`,
          kind: 'todo',
          start,
          end: new Date(start.getTime() + durationMs),
          color: item.activityType?.color ?? '#64748b',
          isTask: true,
          isPast: true,
          isCompleted: true,
        };
      });
  }, [schedule]);

  function onEventDrop({
    event,
    start,
  }: { event: CalendarEvent; start: Date | string }) {
    if (!event.isTask || event.kind !== 'todo') return;
    // event.id format: "scheduled-todo-{id}"
    const match = event.id.match(/^scheduled-todo-(.+)$/);
    if (!match) return;
    const todoId = match[1] ?? '';
    const newStart = start instanceof Date ? start : new Date(start);
    // Send naive local datetime (no Z) so the server stores local time, not UTC
    pinTodo({
      variables: {
        input: {
          id: todoId,
          scheduledAt: format(newStart, "yyyy-MM-dd'T'HH:mm:ss"),
          manuallyScheduled: true,
        },
      },
    }).catch(() => {});
  }

  return (
    <div className="rbc-calendar-wrapper h-full" style={{ minHeight: '400px' }}>
      <DnDCalendar
        localizer={localizer}
        date={date}
        view={view}
        onNavigate={() => {}}
        onView={() => {}}
        toolbar={false}
        events={[...scheduledEvents, ...completedEvents]}
        backgroundEvents={backgroundEvents}
        defaultView="week"
        views={['day', 'week', 'month']}
        step={30}
        timeslots={2}
        eventPropGetter={eventStyleGetter as never}
        components={{ event: CalendarEventComponent as never }}
        style={{ height: '100%' }}
        formats={{
          timeGutterFormat: (date: Date) => format(date, 'h a'),
          eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'h:mm')}–${format(end, 'h:mm a')}`,
        }}
        onEventDrop={onEventDrop}
        resizable={false}
      />
    </div>
  );
}
