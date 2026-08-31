import type {
  ActivityType,
  DB,
  Habit,
  HabitCompletion,
  ManualEvent,
  TimeBlock,
  Todo,
  TodoList,
} from '@auto-cal/db';
import { habitCompletions, todos } from '@auto-cal/db/schema';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import {
  type TodoWithActivityType,
  activityTypeAndAncestors,
  computeSchedule,
  startOfISOWeek,
  startOfLocalMonth,
} from './scheduler.ts';

const HORIZON_MONTHS = 2;

/** Format a Date as "YYYY-MM-DD" using local date parts */
function dateToWeekStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Count habit completions by habitId within [start, end) using the given timestamp field */
function countByPeriod(
  completions: Array<{
    habitId: string;
    completedAt: Date | null;
    scheduledAt: Date | null;
  }>,
  field: 'completedAt' | 'scheduledAt',
  start: Date,
  end: Date,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of completions) {
    const ts = c[field];
    if (!ts) continue;
    if (ts >= start && ts < end) {
      counts.set(c.habitId, (counts.get(c.habitId) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Returns true if the todo's scheduledAt is in the future and still falls
 * within a valid time block for its activity type — or any ancestor type, since
 * a task may inherit its ancestors' general blocks. Used to decide whether to
 * preserve an existing scheduled placement rather than re-running the scheduler.
 */
function isScheduledAtValid(
  todo: TodoWithActivityType,
  timeBlocks: TimeBlock[],
  now: Date,
  activityTypeMap: Map<string, ActivityType>,
): boolean {
  if (!todo.scheduledAt || todo.scheduledAt <= now) return false;
  if (!todo.activityTypeId) return false;

  const validTypeIds = new Set(
    activityTypeAndAncestors(todo.activityTypeId, activityTypeMap),
  );
  const scheduled = new Date(todo.scheduledAt);
  const dayOfWeek = scheduled.getDay(); // 0=Sun…6=Sat
  const scheduledMins = scheduled.getHours() * 60 + scheduled.getMinutes();

  return timeBlocks.some((b) => {
    if (!b.activityTypeId || !validTypeIds.has(b.activityTypeId)) return false;
    if (!b.daysOfWeek.includes(dayOfWeek)) return false;
    const [startH = 0, startM = 0] = b.startTime.split(':').map(Number);
    const [endH = 0, endM = 0] = b.endTime.split(':').map(Number);
    const blockStart = startH * 60 + startM;
    const blockEnd = endH * 60 + endM;
    return scheduledMins >= blockStart && scheduledMins < blockEnd;
  });
}

/** Merge two count maps (add values for same key) */
function addCounts(
  a: Map<string, number>,
  b: Map<string, number>,
): Map<string, number> {
  const result = new Map(a);
  for (const [k, v] of b) {
    result.set(k, (result.get(k) ?? 0) + v);
  }
  return result;
}

export async function runSchedulerWriteback(
  db: DB,
  userId: string,
): Promise<void> {
  const now = new Date();
  const horizonEnd = new Date(now);
  horizonEnd.setMonth(horizonEnd.getMonth() + HORIZON_MONTHS);

  // ── Fetch all user data in one round-trip ──────────────────────────────────
  const [
    userTimeBlocks,
    allIncompleteRawTodos,
    userTodoLists,
    userHabits,
    userActivityTypes,
    allActualCompletions,
    allSkips,
    userManualEvents,
  ] = (await Promise.all([
    db.query.timeBlocks.findMany({
      where: { userId },
    }),
    db.query.todos.findMany({
      where: {
        userId,
        completedAt: { isNull: true },
        OR: [
          { manuallyScheduled: { ne: true } },
          { manuallyScheduled: true, scheduledAt: { lt: now } },
        ],
      },
    }),
    db.query.todoLists.findMany({
      where: { userId },
    }),
    db.query.habits.findMany({
      where: { userId, activityTypeId: { isNotNull: true } },
    }),
    db.query.activityTypes.findMany({
      where: { userId },
    }),
    // Filter through the habit relation to scope by userId — no separate query needed
    db.query.habitCompletions.findMany({
      where: {
        habit: { userId },
        completedAt: { isNotNull: true },
      },
    }),
    // Declined instances. They count toward the period exactly as a completion
    // does, so the deficit loop below does not re-place what the user skipped.
    db.query.habitCompletions.findMany({
      where: { habit: { userId }, skipped: true },
    }),
    db.query.manualEvents.findMany({
      where: { userId, endAt: { gte: now } },
    }),
  ])) as [
    TimeBlock[],
    Todo[],
    TodoList[],
    Habit[],
    ActivityType[],
    HabitCompletion[],
    HabitCompletion[],
    ManualEvent[],
  ];

  const listActivityTypeMap = new Map(
    userTodoLists.map((l) => [l.id, l.activityTypeId]),
  );

  const allIncompleteTodos: TodoWithActivityType[] = allIncompleteRawTodos.map(
    (t) => ({
      ...t,
      activityTypeId: listActivityTypeMap.get(t.listId) ?? null,
    }),
  );

  // ── Reset overdue manually-scheduled todos ─────────────────────────────────
  const overduePinnedIds = allIncompleteTodos
    .filter((t) => t.manuallyScheduled && t.scheduledAt && t.scheduledAt < now)
    .map((t) => t.id);

  if (overduePinnedIds.length > 0) {
    await db
      .update(todos)
      .set({ manuallyScheduled: false, scheduledAt: null, updatedAt: now })
      .where(inArray(todos.id, overduePinnedIds));
  }

  const userTodos: TodoWithActivityType[] = allIncompleteTodos.map((t) =>
    overduePinnedIds.includes(t.id)
      ? { ...t, manuallyScheduled: false, scheduledAt: null }
      : t,
  );

  const activityTypeMap = new Map<string, ActivityType>(
    userActivityTypes.map((at) => [at.id, at]),
  );

  // ── Preserve already-scheduled todos whose slot is still valid ───────────
  // Todos with a future scheduledAt that still falls within an existing time
  // block are kept as-is and excluded from the scheduling loop.
  const prePlacedIds = new Set(
    userTodos
      .filter((t) =>
        isScheduledAtValid(t, userTimeBlocks, now, activityTypeMap),
      )
      .map((t) => t.id),
  );

  // ── Iterate week-by-week over the 2-month horizon ─────────────────────────
  let todoPool = userTodos.filter((t) => !prePlacedIds.has(t.id));
  const todoSchedules = new Map<string, Date | null>(
    userTodos
      .filter((t) => prePlacedIds.has(t.id))
      .map((t) => [t.id, t.scheduledAt ? new Date(t.scheduledAt) : null]),
  );
  const newTentativeCompletions: Array<{
    habitId: string;
    scheduledAt: Date | null;
    completedAt: null;
  }> = [];

  let weekCursor = startOfISOWeek(now);
  while (weekCursor < horizonEnd) {
    const weekStartStr = dateToWeekStr(weekCursor);
    const weekEnd = new Date(weekCursor);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthStart = startOfLocalMonth(weekCursor);
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      1,
    );

    const actualWeek = countByPeriod(
      allActualCompletions as Array<{
        habitId: string;
        completedAt: Date | null;
        scheduledAt: Date | null;
      }>,
      'completedAt',
      weekCursor,
      weekEnd,
    );
    const actualMonth = countByPeriod(
      allActualCompletions as Array<{
        habitId: string;
        completedAt: Date | null;
        scheduledAt: Date | null;
      }>,
      'completedAt',
      monthStart,
      monthEnd,
    );

    const tentativeWeek = countByPeriod(
      newTentativeCompletions,
      'scheduledAt',
      weekCursor,
      weekEnd,
    );
    const tentativeMonth = countByPeriod(
      newTentativeCompletions,
      'scheduledAt',
      monthStart,
      monthEnd,
    );

    const skipWeek = countByPeriod(
      allSkips,
      'scheduledAt',
      weekCursor,
      weekEnd,
    );
    const skipMonth = countByPeriod(
      allSkips,
      'scheduledAt',
      monthStart,
      monthEnd,
    );

    const weekCounts = addCounts(
      addCounts(actualWeek, tentativeWeek),
      skipWeek,
    );
    const monthCounts = addCounts(
      addCounts(actualMonth, tentativeMonth),
      skipMonth,
    );

    const habitInstances: Array<
      (typeof userHabits)[number] & { instanceIndex: number }
    > = [];
    for (const h of userHabits) {
      if (!h.activityTypeId) continue;
      if (h.pomodoroEnabled) {
        // Pomodoro habits don't use frequency-based instances — pass one entry
        // so computeSchedule's pomodoro fill phase can see the habit config.
        habitInstances.push({ ...h, instanceIndex: 0 });
        continue;
      }
      const counts = h.frequencyUnit === 'week' ? weekCounts : monthCounts;
      const done = counts.get(h.id) ?? 0;
      const deficit = h.frequencyCount - done;
      for (let i = 0; i < deficit; i++) {
        habitInstances.push({ ...h, instanceIndex: i });
      }
    }

    // Build pre-scheduled times from all instances placed in prior weeks
    // so the gap constraint is enforced across period boundaries
    const preScheduledHabitTimes = new Map<string, Date[]>();
    for (const c of newTentativeCompletions) {
      if (c.scheduledAt) {
        const times = preScheduledHabitTimes.get(c.habitId) ?? [];
        times.push(c.scheduledAt);
        preScheduledHabitTimes.set(c.habitId, times);
      }
    }

    const items = computeSchedule(
      weekStartStr,
      userTimeBlocks,
      todoPool,
      habitInstances,
      activityTypeMap,
      'UTC',
      userManualEvents,
      preScheduledHabitTimes,
    );

    const placedTodoIds = new Set(
      items.filter((i) => i.kind === 'todo' && i.isScheduled).map((i) => i.id),
    );
    todoPool = todoPool.filter((t) => !placedTodoIds.has(t.id));

    for (const item of items) {
      if (item.kind === 'todo') {
        todoSchedules.set(
          item.id,
          item.scheduledStart ? new Date(item.scheduledStart) : null,
        );
      }
    }

    for (const item of items) {
      if (item.kind === 'habit' && item.isScheduled && item.scheduledStart) {
        newTentativeCompletions.push({
          habitId: item.id.replace(/-\d+$/, ''),
          scheduledAt: new Date(item.scheduledStart),
          completedAt: null,
        });
      }
    }

    weekCursor = weekEnd;
  }

  for (const todo of todoPool) {
    if (!todoSchedules.has(todo.id)) {
      todoSchedules.set(todo.id, null);
    }
  }

  // ── Write todo scheduledAt values ──────────────────────────────────────────
  await Promise.all(
    [...todoSchedules.entries()].map(([id, scheduledAt]) =>
      db
        .update(todos)
        .set({ scheduledAt, updatedAt: new Date() })
        .where(eq(todos.id, id)),
    ),
  );

  // ── Replace tentative habit completions ────────────────────────────────────
  const userHabitIds = userHabits.map((h) => h.id);
  if (userHabitIds.length > 0) {
    await db.delete(habitCompletions).where(
      and(
        inArray(habitCompletions.habitId, userHabitIds),
        isNull(habitCompletions.completedAt),
        // A skip is also an uncompleted row, but it is the user's, not this
        // function's — it has to survive the sweep it would otherwise fall in.
        eq(habitCompletions.skipped, false),
      ),
    );
  }

  if (newTentativeCompletions.length > 0) {
    await db.insert(habitCompletions).values(newTentativeCompletions);
  }
}
