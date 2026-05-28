import type { ActivityType, Habit, TimeBlock, Todo } from '@auto-cal/db';
import { fromZonedTime } from 'date-fns-tz';

/** A Todo plus the activityTypeId resolved from its list — what computeSchedule needs */
export type TodoWithActivityType = Todo & { activityTypeId: string | null };

// ─── Output Types ────────────────────────────────────────────────────────────

export type ScheduledItemKind = 'todo' | 'habit' | 'pomodoro';

export type ScheduledItem = {
  kind: ScheduledItemKind;
  id: string;
  title: string;
  priority: number;
  estimatedLength: number;
  activityTypeId: string | null;
  activityType: ActivityType | null;
  scheduledStart: string | null; // UTC ISO string (e.g. "2026-05-04T09:00:00.000Z")
  scheduledEnd: string | null; // UTC ISO string (e.g. "2026-05-04T10:00:00.000Z")
  isScheduled: boolean;
  isOverdue: boolean;
};

// ─── Internal Types ──────────────────────────────────────────────────────────

type Slot = {
  activityTypeId: string;
  /** Naive ISO date string for the slot day: "YYYY-MM-DD" */
  dateStr: string;
  /** Minutes since midnight for slot start */
  startMinutes: number;
  /** Total capacity of the slot in minutes */
  totalMinutes: number;
  /** Minutes consumed so far */
  usedMinutes: number;
  /** Time block priority — higher is preferred */
  priority: number;
};

type Task = {
  kind: ScheduledItemKind;
  id: string;
  title: string;
  priority: number;
  estimatedLength: number;
  activityTypeId: string | null;
  isOverdue?: boolean;
  minTimeBetweenInstances?: number; // hours; only relevant for habit tasks
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "HH:MM" into total minutes since midnight */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Format minutes-since-midnight as "HH:MM:SS" */
function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/**
 * Build a UTC ISO string from a local date + minutes-since-midnight, using the
 * provided IANA timezone to interpret the local values.
 */
function localToUtcIso(
  dateStr: string,
  minutes: number,
  timezone: string,
): string {
  const localStr = `${dateStr}T${minutesToTimeStr(minutes)}`;
  return fromZonedTime(localStr, timezone).toISOString();
}

/**
 * Return the ISO week start (Monday) as a "YYYY-MM-DD" string.
 * Uses local date arithmetic — weekStart is treated as a local date.
 */
export function startOfISOWeekStr(ref: Date): string {
  const d = new Date(ref);
  const day = d.getDay(); // 0=Sun, 1=Mon … 6=Sat (local)
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Add `days` to a "YYYY-MM-DD" string and return a new "YYYY-MM-DD" string */
function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`); // parse as local midnight
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Return the Monday of the ISO week containing `ref` as a Date at local midnight.
 * Used by the resolver for DB date range queries.
 */
export function startOfISOWeek(ref: Date): Date {
  const dateStr = startOfISOWeekStr(ref);
  return new Date(`${dateStr}T00:00:00`);
}

/**
 * Return the first day of the calendar month containing `ref` as a Date at local midnight.
 */
export function startOfLocalMonth(ref: Date): Date {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  return new Date(`${y}-${m}-01T00:00:00`);
}

/**
 * Expand a recurring TimeBlock into concrete Slot objects for the week
 * starting on `weekStartStr` (a "YYYY-MM-DD" string for a Monday).
 * daysOfWeek: 0=Sun, 1=Mon … 6=Sat.
 */
function expandSlots(weekStartStr: string, block: TimeBlock): Slot[] {
  if (!block.activityTypeId) return [];

  const startMins = timeToMinutes(block.startTime);
  const endMins = timeToMinutes(block.endTime);
  const totalMinutes = endMins - startMins;
  if (totalMinutes <= 0) return [];

  return block.daysOfWeek.map((dayIndex) => {
    // weekStartStr is Monday. dayIndex 0=Sun needs +6, 1=Mon needs +0, etc.
    const offsetFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
    const dateStr = addDaysToDateStr(weekStartStr, offsetFromMonday);
    return {
      activityTypeId: block.activityTypeId as string,
      dateStr,
      startMinutes: startMins,
      totalMinutes,
      usedMinutes: 0,
      priority: block.priority ?? 0,
    };
  });
}

/** Sort tasks: priority DESC, then estimatedLength ASC */
function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.estimatedLength - b.estimatedLength;
  });
}

/**
 * Returns the effective start (minutes since midnight) for the next item
 * placed into this slot, advancing past `now` if the cursor is in the past.
 * Returns null if there is no future capacity left in the slot.
 */
function effectiveSlotStart(
  slot: Slot,
  now: Date,
  durationMins: number,
): number | null {
  const slotEndMins = slot.startMinutes + slot.totalMinutes;
  const cursorMins = slot.startMinutes + slot.usedMinutes;

  // Convert now to minutes since midnight on the slot's date
  const slotDayMidnight = new Date(`${slot.dateStr}T00:00:00`);
  const nowMins = (now.getTime() - slotDayMidnight.getTime()) / (1000 * 60);

  const startMins = Math.ceil(Math.max(cursorMins, nowMins));
  if (startMins + durationMins > slotEndMins) return null;
  return startMins;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Pure scheduling function — no DB calls, no side effects.
 * Returns UTC ISO strings for scheduledStart/scheduledEnd. The local time-block
 * times are interpreted in `timezone` (IANA) and converted to UTC.
 *
 * @param weekStartStr    "YYYY-MM-DD" string for the Monday of the target week
 * @param timeBlocks      All user time blocks
 * @param todos           Incomplete todos with activityTypeId set
 * @param habits          Due habits with activityTypeId set
 * @param activityTypeMap Map<activityTypeId, ActivityType> for O(1) lookup
 * @param timezone        IANA timezone string (e.g. "America/New_York"). Defaults to "UTC".
 */
export function computeSchedule(
  weekStartStr: string,
  timeBlocks: TimeBlock[],
  todos: TodoWithActivityType[],
  habits: Array<Habit & { instanceIndex: number }>,
  activityTypeMap: Map<string, ActivityType>,
  timezone = 'UTC',
  preScheduledHabitTimes?: Map<string, Date[]>,
): ScheduledItem[] {
  // 1. Expand all time blocks into slots for this week
  const allSlots = timeBlocks.flatMap((b) => expandSlots(weekStartStr, b));

  // 2. Group slots by activityTypeId, sorted by (dateStr, startMinutes)
  const slotsByActivityType = new Map<string, Slot[]>();
  for (const slot of allSlots) {
    const existing = slotsByActivityType.get(slot.activityTypeId) ?? [];
    existing.push(slot);
    slotsByActivityType.set(slot.activityTypeId, existing);
  }
  for (const slots of slotsByActivityType.values()) {
    // Higher priority first; ties broken by date then start time
    slots.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const dateCmp = a.dateStr.localeCompare(b.dateStr);
      return dateCmp !== 0 ? dateCmp : a.startMinutes - b.startMinutes;
    });
  }

  // 3. Build and sort the task list
  const now = new Date();

  const todoTasks: Task[] = todos
    .filter((t) => t.activityTypeId !== null)
    .map((t) => ({
      kind: 'todo' as const,
      id: t.id,
      title: t.title,
      priority: t.priority,
      estimatedLength: t.estimatedLength,
      activityTypeId: t.activityTypeId,
      isOverdue: !!(
        t.scheduledAt &&
        new Date(t.scheduledAt) < now &&
        !t.completedAt
      ),
    }));

  const habitTasks: Task[] = habits
    .filter((h) => h.activityTypeId !== null && !h.pomodoroEnabled)
    .map((h) => ({
      kind: 'habit' as const,
      id: `${h.id}-${h.instanceIndex}`,
      title:
        h.instanceIndex > 0 ? `${h.title} (${h.instanceIndex + 1})` : h.title,
      priority: h.priority,
      estimatedLength: h.estimatedLength,
      activityTypeId: h.activityTypeId,
      minTimeBetweenInstances: h.minTimeBetweenInstances ?? 0,
    }));

  const sortedTasks = sortTasks([...todoTasks, ...habitTasks]);

  // 4. Schedule each task into the first fitting slot
  // For habits: prefer spreading instances across different days (intra-week)
  // and enforce minTimeBetweenInstances gap (cross-week via preScheduledHabitTimes)
  const habitDatesUsed = new Map<string, Set<string>>(); // habitBaseId → Set<dateStr>

  // Seeded from prior weeks for cross-period gap enforcement
  const habitScheduledTimes = new Map<string, Date[]>(
    preScheduledHabitTimes
      ? [...preScheduledHabitTimes.entries()].map(([id, times]) => [
          id,
          [...times],
        ])
      : [],
  );

  const results: ScheduledItem[] = [];

  for (const task of sortedTasks) {
    const activityType = task.activityTypeId
      ? (activityTypeMap.get(task.activityTypeId) ?? null)
      : null;

    if (!task.activityTypeId) {
      results.push({
        ...task,
        activityType,
        scheduledStart: null,
        scheduledEnd: null,
        isScheduled: false,
        isOverdue: task.isOverdue ?? false,
      });
      continue;
    }

    if (task.estimatedLength <= 0) {
      results.push({
        ...task,
        activityType,
        scheduledStart: null,
        scheduledEnd: null,
        isScheduled: false,
        isOverdue: task.isOverdue ?? false,
      });
      continue;
    }

    const slots = slotsByActivityType.get(task.activityTypeId);
    if (!slots || slots.length === 0) {
      results.push({
        ...task,
        activityType,
        scheduledStart: null,
        scheduledEnd: null,
        isScheduled: false,
        isOverdue: task.isOverdue ?? false,
      });
      continue;
    }

    // Determine if this is a habit instance and extract the base ID
    const isHabit = task.kind === 'habit';
    const habitBaseId = isHabit ? task.id.replace(/-\d+$/, '') : null;
    const minGapMs = (task.minTimeBetweenInstances ?? 0) * 60 * 60 * 1000;
    const priorTimes = habitBaseId
      ? (habitScheduledTimes.get(habitBaseId) ?? [])
      : [];
    const usedDates = habitBaseId
      ? (habitDatesUsed.get(habitBaseId) ?? new Set<string>())
      : null;

    // Returns true if placing at (slot, startMins) respects the minimum gap
    const respectsGap = (slot: Slot, startMins: number): boolean => {
      if (minGapMs <= 0 || priorTimes.length === 0) return true;
      const candidateMs = new Date(
        localToUtcIso(slot.dateStr, startMins, timezone),
      ).getTime();
      return priorTimes.every(
        (t) => Math.abs(candidateMs - t.getTime()) >= minGapMs,
      );
    };

    let chosenSlot: Slot | null = null;
    let chosenStart: number | null = null;

    // Pass 1 (habits): prefer a slot on a new date that also respects the gap
    if (isHabit && usedDates) {
      for (const slot of slots) {
        const start = effectiveSlotStart(slot, now, task.estimatedLength);
        if (
          start !== null &&
          !usedDates.has(slot.dateStr) &&
          respectsGap(slot, start)
        ) {
          chosenSlot = slot;
          chosenStart = start;
          break;
        }
      }
    }

    // Pass 2 (habits with gap constraint): any slot that respects the gap
    if (!chosenSlot && isHabit && minGapMs > 0) {
      for (const slot of slots) {
        const start = effectiveSlotStart(slot, now, task.estimatedLength);
        if (start !== null && respectsGap(slot, start)) {
          chosenSlot = slot;
          chosenStart = start;
          break;
        }
      }
    }

    // Pass 3: any slot — for todos, and habits with no gap constraint
    // Habits with an unmet gap constraint are left unscheduled (not placed here)
    if (!chosenSlot && (!isHabit || minGapMs === 0)) {
      for (const slot of slots) {
        const start = effectiveSlotStart(slot, now, task.estimatedLength);
        if (start !== null) {
          chosenSlot = slot;
          chosenStart = start;
          break;
        }
      }
    }

    if (!chosenSlot || chosenStart === null) {
      results.push({
        ...task,
        activityType,
        scheduledStart: null,
        scheduledEnd: null,
        isScheduled: false,
        isOverdue: task.isOverdue ?? false,
      });
      continue;
    }

    const taskStartMins = chosenStart;
    const taskEndMins = taskStartMins + task.estimatedLength;
    chosenSlot.usedMinutes = taskEndMins - chosenSlot.startMinutes;

    // Record date and time for this habit instance
    if (habitBaseId) {
      if (usedDates) {
        usedDates.add(chosenSlot.dateStr);
        habitDatesUsed.set(habitBaseId, usedDates);
      }
      const scheduledUtc = new Date(
        localToUtcIso(chosenSlot.dateStr, taskStartMins, timezone),
      );
      const times = habitScheduledTimes.get(habitBaseId) ?? [];
      times.push(scheduledUtc);
      habitScheduledTimes.set(habitBaseId, times);
    }

    results.push({
      ...task,
      activityType,
      scheduledStart: localToUtcIso(
        chosenSlot.dateStr,
        taskStartMins,
        timezone,
      ),
      scheduledEnd: localToUtcIso(chosenSlot.dateStr, taskEndMins, timezone),
      isScheduled: true,
      isOverdue: task.isOverdue ?? false,
    });
  }

  // 5. Pomodoro auto-fill: fill remaining slot capacity with pomodoro units
  //    for habits that have pomodoroEnabled = true. Sorted by priority DESC so
  //    higher-priority habits claim remaining time first.
  const pomodoroHabits = habits
    .filter(
      (
        h,
      ): h is typeof h & {
        pomodoroEnabled: true;
        pomodoroUnitLength: number;
        pomodoroShortBreakLength: number;
        pomodoroUnitsBeforeLongBreak: number;
        pomodoroLongBreakLength: number;
      } =>
        h.pomodoroEnabled === true &&
        h.pomodoroUnitLength != null &&
        h.pomodoroShortBreakLength != null &&
        h.pomodoroUnitsBeforeLongBreak != null &&
        h.pomodoroLongBreakLength != null,
    )
    .sort((a, b) => b.priority - a.priority);

  // De-duplicate by habit base ID (only the highest-instanceIndex matters for fill)
  const seenPomodoroHabitIds = new Set<string>();
  const uniquePomodoroHabits = pomodoroHabits.filter((h) => {
    if (seenPomodoroHabitIds.has(h.id)) return false;
    seenPomodoroHabitIds.add(h.id);
    return true;
  });

  for (const habit of uniquePomodoroHabits) {
    const slots = slotsByActivityType.get(habit.activityTypeId ?? '');
    if (!slots) continue;

    const activityType = habit.activityTypeId
      ? (activityTypeMap.get(habit.activityTypeId) ?? null)
      : null;

    const slotDayMidnightCache = new Map<string, number>();

    for (const slot of slots) {
      let cursor = slot.startMinutes + slot.usedMinutes;
      const slotEnd = slot.startMinutes + slot.totalMinutes;

      // Advance cursor past current time
      if (!slotDayMidnightCache.has(slot.dateStr)) {
        slotDayMidnightCache.set(
          slot.dateStr,
          new Date(`${slot.dateStr}T00:00:00`).getTime(),
        );
      }
      const midnightMs = slotDayMidnightCache.get(slot.dateStr) ?? 0;
      const nowMins = (now.getTime() - midnightMs) / (1000 * 60);
      cursor = Math.max(cursor, Math.ceil(nowMins));

      let unitCountInCycle = 0;
      let pomodoroIndex = 0;

      while (cursor + habit.pomodoroUnitLength <= slotEnd) {
        const unitStart = cursor;
        const unitEnd = cursor + habit.pomodoroUnitLength;

        results.push({
          kind: 'pomodoro',
          id: `${habit.id}-pom-${slot.dateStr}-${pomodoroIndex}`,
          title: `${habit.title} - pom ${pomodoroIndex + 1}`,
          priority: habit.priority,
          estimatedLength: habit.pomodoroUnitLength,
          activityTypeId: habit.activityTypeId,
          activityType,
          scheduledStart: localToUtcIso(slot.dateStr, unitStart, timezone),
          scheduledEnd: localToUtcIso(slot.dateStr, unitEnd, timezone),
          isScheduled: true,
          isOverdue: false,
        });

        pomodoroIndex++;
        unitCountInCycle++;

        const isLongBreak =
          unitCountInCycle >= habit.pomodoroUnitsBeforeLongBreak;
        const breakLength = isLongBreak
          ? habit.pomodoroLongBreakLength
          : habit.pomodoroShortBreakLength;

        if (isLongBreak) unitCountInCycle = 0;

        cursor = unitEnd + breakLength;
      }

      // Consume the remaining slot so no other pomodoro habit double-fills it
      slot.usedMinutes = slotEnd - slot.startMinutes;
    }
  }

  return results;
}
