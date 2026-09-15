import { habitCompletions } from '@auto-cal/db/schema';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { buildScheduleCal } from '../src/ical-route.ts';
import { startOfISOWeekStr } from '../src/services/scheduler.ts';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedActivityType,
  seedHabit,
  seedTimeBlock,
  seedUser,
} from './schema/resolvers/test-helpers.ts';

// ical-route imports the runtime db instance, which throws without
// DATABASE_URL. buildScheduleCal takes its db as an argument, so the PGLite
// test db is what actually runs here.
vi.mock('@auto-cal/db', () => ({ db: {} }));

// The iCal feed and mySchedule used to expand habit instances separately, and
// the feed ignored skips. Both now go through owedHabitInstances; this pins
// that they produce the same instances for the current week.
describe('habit instances: iCal feed agrees with mySchedule', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-05T00:00:00')); // Monday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts a skip in the current period in both', async () => {
    const { id: userId } = await seedUser(db, 'agree-skip@example.com');
    const at = await seedActivityType(db, userId);
    const block = await seedTimeBlock(db, userId, at.id);
    const habit = await seedHabit(db, userId, at.id, {
      frequencyCount: 3,
      frequencyUnit: 'week',
    });
    await db.insert(habitCompletions).values({
      habitId: habit.id,
      skipped: true,
      scheduledAt: new Date('2026-01-06T10:00:00'),
    });

    const result = await gql(
      testSchema,
      db,
      userId,
      'query { mySchedule { id kind isScheduled } }',
    );
    expect(result.errors).toBeUndefined();
    const scheduleIds = (
      result.data?.mySchedule as Array<{
        id: string;
        kind: string;
        isScheduled: boolean;
      }>
    )
      .filter((i) => i.kind === 'habit' && i.isScheduled)
      .map((i) => i.id)
      .sort();

    const weekStartStr = startOfISOWeekStr(new Date());
    const cal = await buildScheduleCal(
      db,
      'UTC',
      weekStartStr,
      [block],
      [],
      [habit],
      new Map([[at.id, at]]),
    );
    const icalIds = cal
      .events()
      .map((e) => e.id())
      .filter((id) => id.endsWith(`-${weekStartStr}@auto-cal`))
      .map((id) => id.slice(0, -`-${weekStartStr}@auto-cal`.length))
      .sort();

    // 3 per week, 1 skipped → 2 owed
    expect(scheduleIds).toHaveLength(2);
    expect(icalIds).toEqual(scheduleIds);
  });
});
