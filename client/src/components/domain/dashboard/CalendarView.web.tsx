import type {
  ScheduledItem_CalendarViewFragment,
  TimeBlock_CalendarViewFragment,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { ColorDot } from '@/components/ui/color-dot';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, LoaderCircle, Pin } from '@/components/ui/icons';
import { useToast } from '@/components/ui/toast';
import { DERIVED, invalidate } from '@/lib/cache';
import { weekStart } from '@/lib/date';
import { priorityLabel } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import FullCalendar, {
  type CalendarRef,
  type EventClickInfo,
  type EventDisplayInfo,
  type EventDropInfo,
  type EventInput,
} from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import classicTheme from '@fullcalendar/react/themes/classic';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import {
  addDays,
  format,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';

import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';

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
    priority
    estimatedLength
    isScheduled
    isOverdue
    scheduledStart
    scheduledEnd
    completedAt
    manuallyScheduled
    dueAt
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

const UNSCHEDULE_TODO = graphql(`
  mutation UnscheduleTodoFromCalendar($id: ID!) {
    myUnscheduleTodo(id: $id) { id scheduledAt manuallyScheduled }
  }
`);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FALLBACK_COLOR = '#64748b';

// Metadata carried on each FullCalendar event via extendedProps.
interface EventMeta {
  isTask: boolean;
  isBackground: boolean;
  isCompleted: boolean;
  kind?: string;
  itemId?: string;
  habitId?: string;
  // Fields surfaced in the click-to-open detail dialog (tasks only).
  detailTitle?: string;
  activityName?: string;
  activityColor?: string;
  isOverdue?: boolean;
  manuallyScheduled?: boolean;
  priority?: number;
  estimatedLength?: number;
  startISO?: string;
  endISO?: string;
  dueAtISO?: string;
  completedAtISO?: string;
}

/** Human-readable date + time range for the detail dialog. */
function formatDetailRange(startISO?: string, endISO?: string): string | null {
  if (!startISO || !endISO) return null;
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const sameDay = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');
  return sameDay
    ? `${format(start, 'EEE, MMM d')} · ${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`
    : `${format(start, 'EEE, MMM d, h:mm a')} – ${format(end, 'EEE, MMM d, h:mm a')}`;
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
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
  now: Date,
): EventInput[] {
  if (!block.activityType) return [];
  // `weekStart` is Monday-based, matching the server's ISO week convention.
  const monday = weekStart(referenceDate);
  const { hours: startH, minutes: startM } = parseTime(block.startTime);
  const { hours: endH, minutes: endM } = parseTime(block.endTime);
  const title = block.activityType.name;
  const color = block.activityType.color;

  return block.daysOfWeek.map((dayIndex: number) => {
    // dayIndex: 0=Sun, 1=Mon…6=Sat. `monday` is the Monday of that week.
    // offset from Monday: Mon=0, Tue=1…Sat=5, Sun=6
    const offsetFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
    const dayDate = addDays(monday, offsetFromMonday);
    const start = setMinutes(setHours(startOfDay(dayDate), startH), startM);
    const end = setMinutes(setHours(startOfDay(dayDate), endH), endM);
    const isPast = end < now;
    const meta: EventMeta = {
      isTask: false,
      isBackground: true,
      isCompleted: false,
    };
    return {
      id: `${block.id}-${dayIndex}`,
      title,
      start,
      end,
      display: 'background',
      color: isPast ? desaturateColor(color) : color,
      editable: false,
      extendedProps: meta,
    } satisfies EventInput;
  });
}

// ─── Custom Event Content ────────────────────────────────────────────────────

function TaskEventContent({ arg }: { arg: EventDisplayInfo }) {
  const meta = arg.event.extendedProps as EventMeta;
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
  const isHabit = meta.kind === 'habit';
  const isTodo = meta.kind === 'todo';
  const canComplete = (isHabit || isTodo) && !meta.isCompleted;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const now = new Date().toISOString();
    const start = arg.event.start ?? new Date();
    if (isHabit && meta.habitId) {
      completeHabit({
        variables: {
          input: {
            habitId: meta.habitId,
            scheduledAt: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
          },
        },
        optimisticResponse: {
          myCompleteHabit: {
            __typename: 'HabitCompletion',
            id: `${arg.event.id}-optimistic`,
            completedAt: now,
          },
        },
      }).catch(console.error);
    } else if (isTodo && meta.itemId) {
      const todoId = meta.itemId;
      completeTodo({
        variables: { id: todoId },
        optimisticResponse: {
          myCompleteTodo: { __typename: 'Todo', id: todoId, completedAt: now },
        },
      }).catch(console.error);
    }
  }

  return (
    <div
      className="relative flex h-full w-full items-center justify-between gap-1 overflow-hidden px-0.5"
      style={{ opacity: completing ? 0.5 : 1, transition: 'opacity 150ms' }}
    >
      {meta.manuallyScheduled && (
        <Pin
          className="pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 rotate-45 fill-current opacity-90"
          aria-label="Manually scheduled"
        />
      )}
      <span
        className="truncate text-xs leading-tight"
        style={{
          textDecoration: meta.isCompleted ? 'line-through' : 'none',
          fontStyle: meta.isCompleted ? 'italic' : 'normal',
          fontWeight: meta.isCompleted ? 400 : 600,
        }}
      >
        {arg.event.title}
      </span>
      {canComplete && (
        <button
          type="button"
          disabled={completing}
          className="flex-shrink-0 rounded p-0.5 opacity-80 hover:bg-black/20 hover:opacity-100 disabled:cursor-not-allowed"
          title={isHabit ? 'Mark habit complete' : 'Mark todo complete'}
          onClick={handleClick}
        >
          {completing ? (
            <LoaderCircle className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

function renderEventContent(arg: EventDisplayInfo) {
  const meta = arg.event.extendedProps as EventMeta;
  // Background time-block shading uses FullCalendar's default (empty) rendering.
  if (meta.isBackground) return undefined;
  return <TaskEventContent arg={arg} />;
}

// ─── Component ───────────────────────────────────────────────────────────────

type CalendarViewMode = 'day' | 'week' | 'month';

const FC_VIEW: Record<CalendarViewMode, string> = {
  day: 'timeGridDay',
  week: 'timeGridWeek',
  month: 'dayGridMonth',
};

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
  const calendarRef = useRef<CalendarRef>(null);
  const [selected, setSelected] = useState<EventMeta | null>(null);
  const toast = useToast();
  // A drop is applied to the calendar before the server confirms it, so a
  // rejection snaps the event back with no other sign it failed.
  const [pinTodo] = useMutation(PIN_TODO, {
    update: (cache) => invalidate(cache, ...DERIVED),
    onError: (err) => toast(err.message || 'Could not move this item'),
  });
  const [unscheduleTodo] = useMutation(UNSCHEDULE_TODO, {
    update: (cache) => invalidate(cache, ...DERIVED),
    onError: (err) => toast(err.message || 'Could not un-pin this item'),
  });

  function handleUnschedule() {
    if (!selected?.itemId) return;
    unscheduleTodo({ variables: { id: selected.itemId } }).catch(console.error);
    setSelected(null);
  }

  const fcView = FC_VIEW[view];

  // The parent owns date/view via the URL; drive FullCalendar imperatively.
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (api.view.type !== fcView) api.changeView(fcView, date);
    else api.gotoDate(date);
  }, [fcView, date]);

  const backgroundEvents = useMemo<EventInput[]>(() => {
    // Skip background time-block shading in month view — too noisy on a grid
    if (view === 'month') return [];
    const now = new Date();
    return timeBlocks.flatMap((block) => expandTimeBlock(block, date, now));
  }, [timeBlocks, date, view]);

  const scheduledEvents = useMemo<EventInput[]>(() => {
    const now = new Date();
    return schedule
      .filter((item) => {
        if (!item.isScheduled || !item.scheduledStart || !item.scheduledEnd)
          return false;
        // Don't show incomplete events that have already ended
        return new Date(item.scheduledEnd) > now;
      })
      .map((item) => {
        const color = item.activityType?.color ?? FALLBACK_COLOR;
        const start = new Date(item.scheduledStart as string);
        const end = new Date(item.scheduledEnd as string);
        const isPast = end < now;
        const kindPrefix = item.kind === 'todo' ? '✓ ' : '↻ ';
        const meta: EventMeta = {
          isTask: true,
          isBackground: false,
          isCompleted: false,
          kind: item.kind,
          itemId: item.id,
          detailTitle: item.title,
          isOverdue: item.isOverdue,
          manuallyScheduled: item.manuallyScheduled,
          priority: item.priority,
          estimatedLength: item.estimatedLength,
          startISO: item.scheduledStart as string,
          endISO: item.scheduledEnd as string,
          ...(item.dueAt ? { dueAtISO: item.dueAt } : {}),
          ...(item.activityType
            ? {
                activityName: item.activityType.name,
                activityColor: item.activityType.color,
              }
            : {}),
          // Habit instance ids look like "<habitId>-<n>"; strip the suffix.
          ...(item.kind === 'habit'
            ? { habitId: item.id.replace(/-\d+$/, '') }
            : {}),
        };
        return {
          id: `scheduled-${item.kind}-${item.id}`,
          title: `${kindPrefix}${item.title}`,
          start,
          end,
          color: isPast ? desaturateColor(color) : color,
          contrastColor: isPast ? '#d1d5db' : '#ffffff',
          // Only todos can be dragged to reschedule.
          startEditable: item.kind === 'todo',
          extendedProps: meta,
        } satisfies EventInput;
      });
  }, [schedule]);

  const completedEvents = useMemo<EventInput[]>(() => {
    return schedule
      .filter(
        (item) =>
          item.kind === 'todo' &&
          item.completedAt &&
          item.scheduledStart &&
          item.scheduledEnd,
      )
      .map((item) => {
        const color = item.activityType?.color ?? FALLBACK_COLOR;
        const start = new Date(item.completedAt as string);
        const scheduledStart = new Date(item.scheduledStart as string);
        const scheduledEnd = new Date(item.scheduledEnd as string);
        const durationMs = scheduledEnd.getTime() - scheduledStart.getTime();
        const meta: EventMeta = {
          isTask: true,
          isBackground: false,
          isCompleted: true,
          kind: 'todo',
          itemId: item.id,
          detailTitle: item.title,
          isOverdue: false,
          manuallyScheduled: false,
          priority: item.priority,
          estimatedLength: item.estimatedLength,
          startISO: item.scheduledStart as string,
          endISO: item.scheduledEnd as string,
          completedAtISO: item.completedAt as string,
          ...(item.dueAt ? { dueAtISO: item.dueAt } : {}),
          ...(item.activityType
            ? {
                activityName: item.activityType.name,
                activityColor: item.activityType.color,
              }
            : {}),
        };
        return {
          id: `completed-todo-${item.id}`,
          title: `✓ ${item.title}`,
          start,
          end: new Date(start.getTime() + durationMs),
          color: desaturateColor(color),
          contrastColor: '#d1d5db',
          startEditable: false,
          extendedProps: meta,
        } satisfies EventInput;
      });
  }, [schedule]);

  const events = useMemo<EventInput[]>(
    () => [...backgroundEvents, ...scheduledEvents, ...completedEvents],
    [backgroundEvents, scheduledEvents, completedEvents],
  );

  function onEventDrop(info: EventDropInfo) {
    const meta = info.event.extendedProps as EventMeta;
    if (meta.kind !== 'todo' || meta.isCompleted || !meta.itemId) {
      info.revert();
      return;
    }
    const newStart = info.event.start;
    if (!newStart) {
      info.revert();
      return;
    }
    // Send naive local datetime (no Z) so the server stores local time, not UTC
    pinTodo({
      variables: {
        input: {
          id: meta.itemId,
          scheduledAt: format(newStart, "yyyy-MM-dd'T'HH:mm:ss"),
          manuallyScheduled: true,
        },
      },
    }).catch((err) => {
      console.error(err);
      info.revert();
    });
  }

  function onEventClick(info: EventClickInfo) {
    const meta = info.event.extendedProps as EventMeta;
    if (meta.isBackground) return;
    // Let the inline complete button handle its own clicks.
    const target = info.jsEvent.target as HTMLElement | null;
    if (target?.closest('button')) return;
    info.jsEvent.preventDefault();
    setSelected(meta);
  }

  const detailRange = selected
    ? formatDetailRange(selected.startISO, selected.endISO)
    : null;
  const dueDate = selected?.dueAtISO ? parseISO(selected.dueAtISO) : null;
  const duePast = dueDate ? dueDate < new Date() : false;
  const canUnschedule = Boolean(
    selected?.manuallyScheduled &&
      selected.kind === 'todo' &&
      !selected.isCompleted,
  );

  return (
    <div className="fc-calendar-wrapper h-full" style={{ minHeight: '400px' }}>
      <FullCalendar
        ref={calendarRef}
        plugins={[
          classicTheme,
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
        ]}
        initialView={fcView}
        initialDate={date}
        headerToolbar={false}
        firstDay={1}
        height="100%"
        expandRows={true}
        nowIndicator={true}
        allDaySlot={false}
        slotDuration="00:30:00"
        scrollTime="07:00:00"
        editable={true}
        eventDurationEditable={false}
        events={events}
        eventContent={renderEventContent}
        eventDrop={onEventDrop}
        eventClick={onEventClick}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
        slotHeaderFormat={{ hour: 'numeric', meridiem: 'short' }}
      />

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-sm">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 pr-6">
                  {selected.activityColor && (
                    <ColorDot color={selected.activityColor} />
                  )}
                  <span>{selected.detailTitle}</span>
                </DialogTitle>
                <DialogDescription className="capitalize">
                  {selected.kind}
                  {selected.isCompleted
                    ? ' · completed'
                    : selected.isOverdue
                      ? ' · overdue'
                      : selected.manuallyScheduled
                        ? ' · manually scheduled'
                        : ' · scheduled'}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2 text-sm">
                {detailRange && (
                  <>
                    <dt className="text-muted-foreground">When</dt>
                    <dd>{detailRange}</dd>
                  </>
                )}
                {dueDate && (
                  <>
                    <dt className="text-muted-foreground">Due</dt>
                    <dd
                      className={duePast ? 'font-medium text-destructive' : ''}
                    >
                      {format(dueDate, 'EEE, MMM d, h:mm a')}
                      {duePast ? ' · overdue' : ''}
                    </dd>
                  </>
                )}
                {selected.activityName && (
                  <>
                    <dt className="text-muted-foreground">Activity</dt>
                    <dd className="flex items-center gap-1.5">
                      {selected.activityColor && (
                        <ColorDot color={selected.activityColor} size="sm" />
                      )}
                      {selected.activityName}
                    </dd>
                  </>
                )}
                {typeof selected.estimatedLength === 'number' && (
                  <>
                    <dt className="text-muted-foreground">Length</dt>
                    <dd>{selected.estimatedLength} min</dd>
                  </>
                )}
                {typeof selected.priority === 'number' && (
                  <>
                    <dt className="text-muted-foreground">Priority</dt>
                    <dd>{priorityLabel(selected.priority)}</dd>
                  </>
                )}
                {selected.completedAtISO && (
                  <>
                    <dt className="text-muted-foreground">Completed</dt>
                    <dd>
                      {format(
                        parseISO(selected.completedAtISO),
                        'EEE, MMM d, h:mm a',
                      )}
                    </dd>
                  </>
                )}
              </dl>
              {canUnschedule && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={handleUnschedule}
                  >
                    Remove manual scheduling
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
