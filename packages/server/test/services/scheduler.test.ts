import type { ActivityType, Habit, TimeBlock } from '@auto-cal/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type TodoWithActivityType,
  computeSchedule,
  startOfISOWeek,
  startOfISOWeekStr,
  startOfLocalMonth,
} from '../../src/services/scheduler.ts';
import {
  makeHabit as baseMakeHabit,
  makeTodo as baseMakeTodo,
  makeActivityType,
  makeTimeBlock,
} from '../test-mocks.ts';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const WORK: ActivityType = makeActivityType({
  id: 'at-work',
  name: 'Work',
  color: '#6366f1',
});

const EXERCISE: ActivityType = makeActivityType({
  id: 'at-exercise',
  name: 'Exercise',
  color: '#22c55e',
});

const AT_MAP = new Map<string, ActivityType>([
  [WORK.id, WORK],
  [EXERCISE.id, EXERCISE],
]);

function makeBlock(overrides: Partial<TimeBlock> = {}): TimeBlock {
  return makeTimeBlock({
    activityTypeId: WORK.id,
    daysOfWeek: [1, 2, 3, 4, 5],
    ...overrides,
  });
}

function makeTodo(
  overrides: Partial<TodoWithActivityType> = {},
): TodoWithActivityType {
  return {
    ...baseMakeTodo(),
    activityTypeId: WORK.id,
    ...overrides,
  } as TodoWithActivityType;
}

function makeHabit(
  overrides: Partial<Habit> & { instanceIndex?: number } = {},
): Habit & { instanceIndex: number } {
  const { instanceIndex = 0, ...rest } = overrides;
  return {
    ...baseMakeHabit({ activityTypeId: EXERCISE.id }),
    instanceIndex,
    ...rest,
  };
}

// Monday May 4 2026 — used as a fixed future week so all slots are upcoming
const WEEK = '2026-05-04';

// ─── startOfISOWeekStr ────────────────────────────────────────────────────────

describe('startOfISOWeekStr', () => {
  it('returns the same Monday when given a Monday', () => {
    expect(startOfISOWeekStr(new Date('2026-05-04T00:00:00'))).toBe(
      '2026-05-04',
    );
  });

  it('returns the previous Monday for a Wednesday', () => {
    expect(startOfISOWeekStr(new Date('2026-05-06T00:00:00'))).toBe(
      '2026-05-04',
    );
  });

  it('returns the previous Monday for a Sunday', () => {
    expect(startOfISOWeekStr(new Date('2026-05-10T00:00:00'))).toBe(
      '2026-05-04',
    );
  });

  it('returns the previous Monday for a Saturday', () => {
    expect(startOfISOWeekStr(new Date('2026-05-09T00:00:00'))).toBe(
      '2026-05-04',
    );
  });

  it('handles year boundaries correctly', () => {
    // Jan 1 2026 is a Thursday — ISO week Monday is Dec 29 2025
    expect(startOfISOWeekStr(new Date('2026-01-01T00:00:00'))).toBe(
      '2025-12-29',
    );
  });
});

// ─── startOfISOWeek ───────────────────────────────────────────────────────────

describe('startOfISOWeek', () => {
  it('returns a Date at local midnight on Monday', () => {
    const result = startOfISOWeek(new Date('2026-05-06T12:00:00')); // Wednesday
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(startOfISOWeekStr(result)).toBe('2026-05-04');
  });
});

// ─── startOfLocalMonth ────────────────────────────────────────────────────────

describe('startOfLocalMonth', () => {
  it('returns the first of the month at midnight', () => {
    const result = startOfLocalMonth(new Date('2026-05-15T10:30:00'));
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(4); // May = index 4
    expect(result.getHours()).toBe(0);
  });
});

// ─── computeSchedule ─────────────────────────────────────────────────────────

describe('computeSchedule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set "now" to Monday midnight — all time-block slots are in the future
    vi.setSystemTime(new Date(`${WEEK}T00:00:00`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an empty array when there are no todos or habits', () => {
    expect(computeSchedule(WEEK, [makeBlock()], [], [], AT_MAP)).toEqual([]);
  });

  it('schedules a todo into a matching time block', () => {
    const [result] = computeSchedule(
      WEEK,
      [makeBlock({ daysOfWeek: [1], startTime: '09:00', endTime: '17:00' })],
      [makeTodo({ estimatedLength: 60 })],
      [],
      AT_MAP,
    );
    expect(result?.isScheduled).toBe(true);
    expect(result?.scheduledStart).toBe('2026-05-04T09:00:00.000Z');
    expect(result?.scheduledEnd).toBe('2026-05-04T10:00:00.000Z');
    expect(result?.activityType?.name).toBe('Work');
  });

  it('marks a todo as unscheduled when there are no time blocks', () => {
    const [result] = computeSchedule(WEEK, [], [makeTodo()], [], AT_MAP);
    expect(result?.isScheduled).toBe(false);
    expect(result?.scheduledStart).toBeNull();
  });

  it('marks a todo as unscheduled when no time block matches its activity type', () => {
    const [result] = computeSchedule(
      WEEK,
      [makeBlock({ activityTypeId: WORK.id })],
      [makeTodo({ activityTypeId: EXERCISE.id })],
      [],
      AT_MAP,
    );
    expect(result?.isScheduled).toBe(false);
  });

  it('marks a todo as unscheduled when it is too long for any available slot', () => {
    const [result] = computeSchedule(
      WEEK,
      [makeBlock({ daysOfWeek: [1], startTime: '09:00', endTime: '10:00' })], // 60 min
      [makeTodo({ estimatedLength: 90 })], // needs 90 min
      [],
      AT_MAP,
    );
    expect(result?.isScheduled).toBe(false);
  });

  it('marks a todo as unscheduled when estimatedLength is zero', () => {
    const [result] = computeSchedule(
      WEEK,
      [makeBlock()],
      [makeTodo({ estimatedLength: 0 })],
      [],
      AT_MAP,
    );
    expect(result?.isScheduled).toBe(false);
  });

  it('schedules higher-priority todos before lower-priority ones', () => {
    const high = makeTodo({
      id: 'todo-high',
      priority: 10,
      estimatedLength: 60,
    });
    const low = makeTodo({ id: 'todo-low', priority: 1, estimatedLength: 60 });
    // One 60-min slot on Monday — only one todo can fit
    const result = computeSchedule(
      WEEK,
      [makeBlock({ daysOfWeek: [1], startTime: '09:00', endTime: '10:00' })],
      [high, low],
      [],
      AT_MAP,
    );
    const scheduled = result.filter((r) => r.isScheduled);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]?.id).toBe('todo-high');
  });

  it('places a second todo into the next available slot when the first is full', () => {
    const t1 = makeTodo({ id: 'todo-1', priority: 2, estimatedLength: 60 });
    const t2 = makeTodo({ id: 'todo-2', priority: 1, estimatedLength: 60 });
    const result = computeSchedule(
      WEEK,
      [
        makeBlock({
          id: 'tb-mon',
          daysOfWeek: [1],
          startTime: '09:00',
          endTime: '10:00',
        }),
        makeBlock({
          id: 'tb-tue',
          daysOfWeek: [2],
          startTime: '09:00',
          endTime: '10:00',
        }),
      ],
      [t1, t2],
      [],
      AT_MAP,
    );
    expect(result.every((r) => r.isScheduled)).toBe(true);
    expect(result.find((r) => r.id === 'todo-1')?.scheduledStart).toBe(
      '2026-05-04T09:00:00.000Z',
    );
    expect(result.find((r) => r.id === 'todo-2')?.scheduledStart).toBe(
      '2026-05-05T09:00:00.000Z',
    );
  });

  it('packs two todos back-to-back within the same slot', () => {
    const t1 = makeTodo({ id: 'todo-1', priority: 2, estimatedLength: 60 });
    const t2 = makeTodo({ id: 'todo-2', priority: 1, estimatedLength: 60 });
    const result = computeSchedule(
      WEEK,
      [makeBlock({ daysOfWeek: [1], startTime: '09:00', endTime: '12:00' })], // 180 min
      [t1, t2],
      [],
      AT_MAP,
    );
    expect(result.every((r) => r.isScheduled)).toBe(true);
    expect(result.find((r) => r.id === 'todo-1')?.scheduledStart).toBe(
      '2026-05-04T09:00:00.000Z',
    );
    expect(result.find((r) => r.id === 'todo-2')?.scheduledStart).toBe(
      '2026-05-04T10:00:00.000Z',
    );
  });

  it('marks a todo with past scheduledAt as overdue', () => {
    const [result] = computeSchedule(
      WEEK,
      [makeBlock()],
      [
        makeTodo({
          scheduledAt: new Date('2026-04-01T09:00:00'),
          completedAt: null,
        }),
      ],
      [],
      AT_MAP,
    );
    expect(result?.isOverdue).toBe(true);
  });

  it('does not mark a completed todo as overdue', () => {
    const [result] = computeSchedule(
      WEEK,
      [makeBlock()],
      [
        makeTodo({
          scheduledAt: new Date('2026-04-01T09:00:00'),
          completedAt: new Date('2026-04-01T10:00:00'),
        }),
      ],
      [],
      AT_MAP,
    );
    expect(result?.isOverdue).toBe(false);
  });

  it('skips elapsed time in a slot that is partially in the past', () => {
    vi.setSystemTime(new Date(`${WEEK}T12:00:00`)); // noon on Monday
    const [result] = computeSchedule(
      WEEK,
      [makeBlock({ daysOfWeek: [1], startTime: '09:00', endTime: '17:00' })],
      [makeTodo({ estimatedLength: 60 })],
      [],
      AT_MAP,
    );
    expect(result?.isScheduled).toBe(true);
    // Should start at 12:00 (skipping the already-elapsed 09:00–12:00 portion)
    expect(result?.scheduledStart?.slice(11, 16)).toBe('12:00');
  });

  it('schedules a habit into a matching time block', () => {
    const [result] = computeSchedule(
      WEEK,
      [
        makeBlock({
          activityTypeId: EXERCISE.id,
          daysOfWeek: [1],
          startTime: '07:00',
          endTime: '08:00',
        }),
      ],
      [],
      [makeHabit({ estimatedLength: 30 })],
      AT_MAP,
    );
    expect(result?.isScheduled).toBe(true);
    expect(result?.kind).toBe('habit');
    expect(result?.scheduledStart).toBe('2026-05-04T07:00:00.000Z');
  });

  it('spreads two habit instances across different days when possible', () => {
    const instances = [
      makeHabit({ instanceIndex: 0 }),
      makeHabit({ instanceIndex: 1 }),
    ];
    const result = computeSchedule(
      WEEK,
      [
        makeBlock({
          activityTypeId: EXERCISE.id,
          daysOfWeek: [1, 2, 3],
          startTime: '07:00',
          endTime: '08:00',
        }),
      ],
      [],
      instances,
      AT_MAP,
    );
    const scheduledDays = result
      .filter((r) => r.isScheduled)
      .map((r) => r.scheduledStart?.slice(0, 10));
    expect(new Set(scheduledDays).size).toBe(2);
  });

  it('schedules todos and habits from different activity types independently', () => {
    const result = computeSchedule(
      WEEK,
      [
        makeBlock({
          activityTypeId: WORK.id,
          daysOfWeek: [1],
          startTime: '09:00',
          endTime: '10:00',
        }),
        makeBlock({
          id: 'tb-ex',
          activityTypeId: EXERCISE.id,
          daysOfWeek: [1],
          startTime: '07:00',
          endTime: '08:00',
        }),
      ],
      [makeTodo({ activityTypeId: WORK.id, estimatedLength: 60 })],
      [makeHabit({ activityTypeId: EXERCISE.id, estimatedLength: 30 })],
      AT_MAP,
    );
    expect(result.filter((r) => r.isScheduled)).toHaveLength(2);
  });
});

// ─── Activity-type inheritance (project dedicated blocks) ─────────────────────

describe('computeSchedule — activity-type inheritance', () => {
  // REDESIGN is a dedicated (project) type nested under WORK.
  const REDESIGN: ActivityType = makeActivityType({
    id: 'at-redesign',
    name: 'Redesign',
    color: '#f59e0b',
    parentId: WORK.id,
  });
  const HIER_MAP = new Map<string, ActivityType>([
    [WORK.id, WORK],
    [REDESIGN.id, REDESIGN],
    [EXERCISE.id, EXERCISE],
  ]);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${WEEK}T00:00:00`));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules a child-type task into its own dedicated block', () => {
    const [result] = computeSchedule(
      WEEK,
      [
        makeBlock({
          activityTypeId: WORK.id,
          daysOfWeek: [1],
          startTime: '09:00',
          endTime: '17:00',
        }),
        makeBlock({
          id: 'tb-redesign',
          activityTypeId: REDESIGN.id,
          daysOfWeek: [1],
          startTime: '13:00',
          endTime: '14:00',
        }),
      ],
      [makeTodo({ activityTypeId: REDESIGN.id, estimatedLength: 60 })],
      [],
      HIER_MAP,
    );
    expect(result?.isScheduled).toBe(true);
    // Lands in the dedicated 13:00 block, not the general 09:00 one.
    expect(result?.scheduledStart).toBe('2026-05-04T13:00:00.000Z');
  });

  it('falls back to an ancestor block when no dedicated block exists', () => {
    const [result] = computeSchedule(
      WEEK,
      [
        makeBlock({
          activityTypeId: WORK.id,
          daysOfWeek: [1],
          startTime: '09:00',
          endTime: '17:00',
        }),
      ],
      [makeTodo({ activityTypeId: REDESIGN.id, estimatedLength: 60 })],
      [],
      HIER_MAP,
    );
    expect(result?.isScheduled).toBe(true);
    expect(result?.scheduledStart).toBe('2026-05-04T09:00:00.000Z');
  });

  it('prefers the dedicated block even when an ancestor block has higher priority', () => {
    const [result] = computeSchedule(
      WEEK,
      [
        makeBlock({
          activityTypeId: WORK.id,
          daysOfWeek: [1],
          startTime: '09:00',
          endTime: '10:00',
          priority: 100,
        }),
        makeBlock({
          id: 'tb-redesign',
          activityTypeId: REDESIGN.id,
          daysOfWeek: [1],
          startTime: '14:00',
          endTime: '15:00',
          priority: 0,
        }),
      ],
      [makeTodo({ activityTypeId: REDESIGN.id, estimatedLength: 60 })],
      [],
      HIER_MAP,
    );
    expect(result?.isScheduled).toBe(true);
    // Own-type slot wins despite the ancestor block's higher priority.
    expect(result?.scheduledStart).toBe('2026-05-04T14:00:00.000Z');
  });

  it('never schedules an ancestor-type task into a descendant dedicated block', () => {
    const [result] = computeSchedule(
      WEEK,
      [
        makeBlock({
          id: 'tb-redesign',
          activityTypeId: REDESIGN.id,
          daysOfWeek: [1],
          startTime: '09:00',
          endTime: '17:00',
        }),
      ],
      [makeTodo({ activityTypeId: WORK.id, estimatedLength: 60 })],
      [],
      HIER_MAP,
    );
    expect(result?.isScheduled).toBe(false);
  });

  it('terminates and schedules when the parent chain contains a cycle', () => {
    // Self-cycle: a corrupt/degenerate parent pointer must not loop forever.
    const SELF: ActivityType = makeActivityType({
      id: 'at-self',
      name: 'Self',
      parentId: 'at-self',
    });
    const cycleMap = new Map<string, ActivityType>([[SELF.id, SELF]]);
    const [result] = computeSchedule(
      WEEK,
      [
        makeBlock({
          activityTypeId: SELF.id,
          daysOfWeek: [1],
          startTime: '09:00',
          endTime: '10:00',
        }),
      ],
      [makeTodo({ activityTypeId: SELF.id, estimatedLength: 60 })],
      [],
      cycleMap,
    );
    expect(result?.isScheduled).toBe(true);
    expect(result?.scheduledStart).toBe('2026-05-04T09:00:00.000Z');
  });
});
