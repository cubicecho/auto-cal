/**
 * Integration tests for runSchedulerWriteback using PGLite in-memory.
 * Tests are exercised through the resolver layer (myReschedule) so the full
 * stack runs, but also call the function directly for targeted branch coverage.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relations } from '@auto-cal/db/relations';
import * as schema from '@auto-cal/db/schema';
import {
  activityTypes,
  habitCompletions,
  habits,
  timeBlocks,
  todoLists,
  todos,
  users,
} from '@auto-cal/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { runSchedulerWriteback } from '../../src/services/scheduler-writeback.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../../../packages/db/drizzle');

type TestDb = Awaited<ReturnType<typeof createDb>>;

function seed<T>(rows: T[]): T {
  const row = rows[0];
  if (!row) throw new Error('seed failed');
  return row;
}

async function createDb() {
  const client = new PGlite('memory://');
  await client.waitReady;
  // @ts-expect-error drizzle-orm 1.0-beta removed `schema` from config types but it remains valid at runtime
  const db = drizzle({ client, schema, relations });
  await migrate(db, { migrationsFolder });
  return db;
}

describe('runSchedulerWriteback', () => {
  let db: TestDb;
  let userId: string;
  let activityTypeId: string;

  beforeAll(async () => {
    db = await createDb();
  }, 30000);

  beforeEach(async () => {
    const user = seed(
      await db
        .insert(users)
        .values({ email: `writeback-${Date.now()}@example.com` })
        .returning(),
    );
    userId = user.id;

    const at = seed(
      await db
        .insert(activityTypes)
        .values({ userId, name: 'Work', color: '#6366f1' })
        .returning(),
    );
    activityTypeId = at.id;
  });

  it('runs without error when user has no data', async () => {
    await expect(runSchedulerWriteback(db, userId)).resolves.toBeUndefined();
  });

  it('sets scheduledAt on todos that fit in a time block', async () => {
    await db.insert(timeBlocks).values({
      userId,
      activityTypeId,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '17:00',
      priority: 0,
    });
    const list = seed(
      await db
        .insert(todoLists)
        .values({ userId, name: 'Work', activityTypeId })
        .returning(),
    );
    const todo = seed(
      await db
        .insert(todos)
        .values({ userId, listId: list.id, title: 'Task', estimatedLength: 30 })
        .returning(),
    );

    await runSchedulerWriteback(db, userId);

    const [updated] = await db.query.todos.findMany({ where: { id: todo.id } });
    expect(updated?.scheduledAt).not.toBeNull();
  });

  it('sets scheduledAt to null for todos with no matching time block', async () => {
    const list = seed(
      await db
        .insert(todoLists)
        .values({ userId, name: 'Work', activityTypeId })
        .returning(),
    );
    const todo = seed(
      await db
        .insert(todos)
        .values({
          userId,
          listId: list.id,
          title: 'Unplaceable',
          estimatedLength: 30,
        })
        .returning(),
    );

    await runSchedulerWriteback(db, userId);

    const [updated] = await db.query.todos.findMany({ where: { id: todo.id } });
    expect(updated?.scheduledAt).toBeNull();
  });

  it('creates tentative habit completions for habits with a deficit', async () => {
    await db.insert(timeBlocks).values({
      userId,
      activityTypeId,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '17:00',
      priority: 0,
    });
    const habit = seed(
      await db
        .insert(habits)
        .values({
          userId,
          activityTypeId,
          title: 'Morning run',
          estimatedLength: 30,
          frequencyCount: 3,
          frequencyUnit: 'week',
          priority: 1,
        })
        .returning(),
    );

    await runSchedulerWriteback(db, userId);

    const tentative = await db.query.habitCompletions.findMany({
      where: { habitId: habit.id },
    });
    expect(tentative.some((c) => c.completedAt === null)).toBe(true);
  });

  it('resets tentative completions on each writeback run', async () => {
    await db.insert(timeBlocks).values({
      userId,
      activityTypeId,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '17:00',
      priority: 0,
    });
    const habit = seed(
      await db
        .insert(habits)
        .values({
          userId,
          activityTypeId,
          title: 'Exercise',
          estimatedLength: 30,
          frequencyCount: 2,
          frequencyUnit: 'week',
          priority: 1,
        })
        .returning(),
    );

    await runSchedulerWriteback(db, userId);
    const firstRun = await db.query.habitCompletions.findMany({
      where: { habitId: habit.id },
    });

    await runSchedulerWriteback(db, userId);
    const secondRun = await db.query.habitCompletions.findMany({
      where: { habitId: habit.id },
    });

    const firstTentative = firstRun.filter(
      (c) => c.completedAt === null,
    ).length;
    const secondTentative = secondRun.filter(
      (c) => c.completedAt === null,
    ).length;
    expect(secondTentative).toBe(firstTentative);
  });

  it('resets overdue pinned todos and re-schedules them', async () => {
    await db.insert(timeBlocks).values({
      userId,
      activityTypeId,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '17:00',
      priority: 0,
    });
    const list = seed(
      await db
        .insert(todoLists)
        .values({ userId, name: 'Work', activityTypeId })
        .returning(),
    );
    const past = new Date(Date.now() - 86_400_000);
    const todo = seed(
      await db
        .insert(todos)
        .values({
          userId,
          listId: list.id,
          title: 'Overdue pinned',
          estimatedLength: 30,
          manuallyScheduled: true,
          scheduledAt: past,
        })
        .returning(),
    );

    await runSchedulerWriteback(db, userId);

    const [updated] = await db.query.todos.findMany({ where: { id: todo.id } });
    expect(updated?.manuallyScheduled).toBe(false);
  });

  it('preserves a pre-placed todo with a valid future slot', async () => {
    await db.insert(timeBlocks).values({
      userId,
      activityTypeId,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '17:00',
      priority: 0,
    });
    const list = seed(
      await db
        .insert(todoLists)
        .values({ userId, name: 'Work', activityTypeId })
        .returning(),
    );

    const future = new Date();
    future.setDate(future.getDate() + 1);
    future.setHours(10, 0, 0, 0);

    const todo = seed(
      await db
        .insert(todos)
        .values({
          userId,
          listId: list.id,
          title: 'Pre-placed',
          estimatedLength: 30,
          scheduledAt: future,
        })
        .returning(),
    );

    await runSchedulerWriteback(db, userId);

    const [updated] = await db.query.todos.findMany({ where: { id: todo.id } });
    expect(updated?.scheduledAt).not.toBeNull();
  });

  it('preserves an inherited placement in an ancestor time block', async () => {
    // A dedicated child activity type nested under Work, with a time block that
    // exists ONLY on the parent. A todo pre-placed into that parent block must
    // be treated as valid (inherited) and left exactly where it is.
    const childType = seed(
      await db
        .insert(activityTypes)
        .values({
          userId,
          name: 'Redesign',
          color: '#f59e0b',
          parentId: activityTypeId,
        })
        .returning(),
    );
    await db.insert(timeBlocks).values({
      userId,
      activityTypeId, // parent (Work) block only — no dedicated child block
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '17:00',
      priority: 0,
    });
    const list = seed(
      await db
        .insert(todoLists)
        .values({ userId, name: 'Redesign', activityTypeId: childType.id })
        .returning(),
    );

    // Pre-place at 10:00 — offset from the 09:00 block start so a rewrite would
    // move it and this assertion would fail.
    const future = new Date();
    future.setDate(future.getDate() + 1);
    future.setHours(10, 0, 0, 0);

    const todo = seed(
      await db
        .insert(todos)
        .values({
          userId,
          listId: list.id,
          title: 'Inherited placement',
          estimatedLength: 30,
          scheduledAt: future,
        })
        .returning(),
    );

    await runSchedulerWriteback(db, userId);

    const [updated] = await db.query.todos.findMany({ where: { id: todo.id } });
    expect(updated?.scheduledAt?.getTime()).toBe(future.getTime());
  });

  it('does not delete real (completed) habit completions during writeback', async () => {
    await db.insert(timeBlocks).values({
      userId,
      activityTypeId,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '17:00',
      priority: 0,
    });
    const habit = seed(
      await db
        .insert(habits)
        .values({
          userId,
          activityTypeId,
          title: 'Real completion habit',
          estimatedLength: 30,
          frequencyCount: 1,
          frequencyUnit: 'week',
          priority: 1,
        })
        .returning(),
    );
    await db
      .insert(habitCompletions)
      .values({ habitId: habit.id, completedAt: new Date() });

    await runSchedulerWriteback(db, userId);

    const completions = await db.query.habitCompletions.findMany({
      where: { habitId: habit.id },
    });
    const real = completions.filter((c) => c.completedAt !== null);
    expect(real.length).toBeGreaterThanOrEqual(1);
  });
});
