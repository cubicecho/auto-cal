import { db } from '@auto-cal/db';
import type {
  ActivityType,
  Habit,
  HabitCompletion,
  TimeBlock,
  Todo,
  TodoList,
} from '@auto-cal/db';
import { apiKeys } from '@auto-cal/db/schema';
import { fromZonedTime } from 'date-fns-tz';
import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import ical, { ICalEventRepeatingFreq, ICalWeekday } from 'ical-generator';
import { hashApiKey, isApiKey } from './api-keys.ts';
import {
  type TodoWithActivityType,
  computeSchedule,
  startOfISOWeek,
  startOfISOWeekStr,
  startOfLocalMonth,
} from './services/scheduler.ts';

// Day-of-week number (JS: 0=Sun … 6=Sat) → iCal weekday token
const DAY_TO_ICAL: ICalWeekday[] = [
  ICalWeekday.SU,
  ICalWeekday.MO,
  ICalWeekday.TU,
  ICalWeekday.WE,
  ICalWeekday.TH,
  ICalWeekday.FR,
  ICalWeekday.SA,
];

function addWeeks(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n * 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Build a UTC Date for a given local date string + HH:mm time + timezone. */
function localTimeToUtc(dateStr: string, hhmm: string, timezone: string): Date {
  return fromZonedTime(`${dateStr}T${hhmm}:00`, timezone);
}

/**
 * Generate iCal events for recurring time blocks.
 * Each block becomes a single RRULE:FREQ=WEEKLY event anchored to this week,
 * repeating indefinitely on the specified days.
 */
function buildTimeBlocksCal(
  timeBlocks: TimeBlock[],
  activityTypeMap: Map<string, ActivityType>,
  weekStartStr: string,
  timezone: string,
): ReturnType<typeof ical> {
  const cal = ical({ name: 'Auto Cal — Time Blocks' });

  for (const block of timeBlocks) {
    const days = [...block.daysOfWeek].sort();
    if (days.length === 0) continue;

    const byDay = days
      .map((d) => DAY_TO_ICAL[d])
      .filter((d): d is ICalWeekday => d !== undefined);
    const activityType = block.activityTypeId
      ? activityTypeMap.get(block.activityTypeId)
      : undefined;

    // Anchor on the first listed day of this week.
    // weekStartStr is the Monday of the current ISO week.
    // Offset from Monday: Mon=1→0, Tue=2→1, … Sun=0→6
    const firstDay = days[0] as number;
    const offsetFromMonday = firstDay === 0 ? 6 : firstDay - 1;
    const anchorDateStr = addWeeks(weekStartStr, 0);
    const anchorDate = new Date(`${anchorDateStr}T00:00:00`);
    anchorDate.setDate(anchorDate.getDate() + offsetFromMonday);
    const anchorStr = anchorDate.toISOString().slice(0, 10);

    const start = localTimeToUtc(anchorStr, block.startTime, timezone);
    const end = localTimeToUtc(anchorStr, block.endTime, timezone);

    cal.createEvent({
      id: `block-${block.id}@auto-cal`,
      start,
      end,
      timezone,
      summary: activityType?.name ?? 'Time Block',
      description: `Time block: ${block.startTime} – ${block.endTime}`,
      repeating: {
        freq: ICalEventRepeatingFreq.WEEKLY,
        byDay,
      },
    });
  }

  return cal;
}

/**
 * Generate iCal events for the computed schedule (todos + habits) over 2 weeks.
 */
async function buildScheduleCal(
  timezone: string,
  weekStartStr: string,
  timeBlocks: TimeBlock[],
  todos: TodoWithActivityType[],
  habits: Habit[],
  activityTypeMap: Map<string, ActivityType>,
): Promise<ReturnType<typeof ical>> {
  const cal = ical({ name: 'Auto Cal — Schedule' });
  const habitIds = habits.map((h) => h.id);

  for (let w = 0; w < 2; w++) {
    const ws = addWeeks(weekStartStr, w);
    const weekStart = startOfISOWeek(new Date(`${ws}T00:00:00`));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthStart = startOfLocalMonth(weekStart);
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      1,
    );

    const [weekCompletions, monthCompletions]: [
      HabitCompletion[],
      HabitCompletion[],
    ] =
      habitIds.length === 0
        ? [[], []]
        : await Promise.all([
            db.query.habitCompletions.findMany({
              where: {
                habitId: { in: habitIds },
                completedAt: { isNotNull: true, gte: weekStart, lte: weekEnd },
              },
            }),
            db.query.habitCompletions.findMany({
              where: {
                habitId: { in: habitIds },
                completedAt: {
                  isNotNull: true,
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
            }),
          ]);

    const weekCounts = new Map<string, number>();
    for (const c of weekCompletions)
      weekCounts.set(c.habitId, (weekCounts.get(c.habitId) ?? 0) + 1);

    const monthCounts = new Map<string, number>();
    for (const c of monthCompletions)
      monthCounts.set(c.habitId, (monthCounts.get(c.habitId) ?? 0) + 1);

    const habitInstances: Array<Habit & { instanceIndex: number }> = [];
    for (const h of habits) {
      const counts = h.frequencyUnit === 'week' ? weekCounts : monthCounts;
      const done = counts.get(h.id) ?? 0;
      const deficit = h.frequencyCount - done;
      if (deficit <= 0) continue;
      for (let i = 0; i < deficit; i++)
        habitInstances.push({ ...h, instanceIndex: i });
    }

    const items = computeSchedule(
      ws,
      timeBlocks,
      todos,
      habitInstances,
      activityTypeMap,
      timezone,
    );

    for (const item of items) {
      if (!item.isScheduled || !item.scheduledStart || !item.scheduledEnd)
        continue;

      cal.createEvent({
        id: `${item.id}-${ws}@auto-cal`,
        start: new Date(item.scheduledStart),
        end: new Date(item.scheduledEnd),
        summary: item.title,
        description: [
          `Type: ${item.kind === 'todo' ? 'Todo' : 'Habit'}`,
          item.activityType ? `Activity: ${item.activityType.name}` : null,
          `Priority: ${item.priority}`,
          `Estimated: ${item.estimatedLength} min`,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    }
  }

  return cal;
}

export async function icalHandler(req: Request, res: Response): Promise<void> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { secret, view } = req.query;

  if (!secret || typeof secret !== 'string' || !isApiKey(secret)) {
    res.status(400).send('Invalid secret');
    return;
  }

  const hash = hashApiKey(secret);
  const key = await db.query.apiKeys.findFirst({ where: { keyHash: hash } });
  const now = new Date();
  if (
    !key ||
    key.revokedAt !== null ||
    (key.expiresAt !== null && key.expiresAt < now)
  ) {
    res.status(401).send('Invalid or expired API key');
    return;
  }
  if (!key.scopes.includes('read')) {
    res.status(403).send('API key requires read scope');
    return;
  }
  db.update(apiKeys)
    .set({ lastUsedAt: now })
    .where(eq(apiKeys.id, key.id))
    .catch(console.error);

  const user = await db.query.users.findFirst({ where: { id: key.userId } });
  if (!user) {
    res.status(404).send('User not found');
    return;
  }

  const userId = user.id;
  const timezone = user.timezone;
  const weekStartStr = startOfISOWeekStr(new Date());

  // ── Data fetch ────────────────────────────────────────────────────────────
  const [timeBlocks, rawTodos, todoLists, habits, activityTypes]: [
    TimeBlock[],
    Todo[],
    TodoList[],
    Habit[],
    ActivityType[],
  ] = await Promise.all([
    db.query.timeBlocks.findMany({ where: { userId } }),
    db.query.todos.findMany({
      where: { userId, completedAt: { isNull: true } },
    }),
    db.query.todoLists.findMany({ where: { userId } }),
    db.query.habits.findMany({
      where: { userId, activityTypeId: { isNotNull: true } },
    }),
    db.query.activityTypes.findMany({ where: { userId } }),
  ]);

  const activityTypeMap = new Map<string, ActivityType>(
    activityTypes.map((at) => [at.id, at]),
  );

  // ── Build calendar ────────────────────────────────────────────────────────
  let cal: ReturnType<typeof ical>;

  if (view === 'blocks') {
    cal = buildTimeBlocksCal(
      timeBlocks,
      activityTypeMap,
      weekStartStr,
      timezone,
    );
  } else {
    const listActivityTypeMap = new Map(
      todoLists.map((l) => [l.id, l.activityTypeId]),
    );
    const todos: TodoWithActivityType[] = rawTodos.map((t) => ({
      ...t,
      activityTypeId: listActivityTypeMap.get(t.listId) ?? null,
    }));

    cal = await buildScheduleCal(
      timezone,
      weekStartStr,
      timeBlocks,
      todos,
      habits,
      activityTypeMap,
    );
  }

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="auto-cal.ics"');
  res.send(cal.toString());
}
