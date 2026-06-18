import { beforeAll, describe, expect, it } from 'vitest';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedActivityType,
  seedUser,
} from './test-helpers.ts';

describe('time-block resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  // ─── myTimeBlocks ─────────────────────────────────────────────────────────────

  describe('myTimeBlocks', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'query { myTimeBlocks { id } }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it("returns only the current user's time blocks", async () => {
      const { id: userId } = await seedUser(db, 'tb-isolation@example.com');
      const { id: otherId } = await seedUser(db, 'tb-other@example.com');
      const at = await seedActivityType(db, userId);
      const otherAt = await seedActivityType(db, otherId);
      await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: at.id,
            daysOfWeek: [1],
            startTime: '09:00',
            endTime: '10:00',
          },
        },
      );
      await gql(
        testSchema,
        db,
        otherId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: otherAt.id,
            daysOfWeek: [2],
            startTime: '11:00',
            endTime: '12:00',
          },
        },
      );

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myTimeBlocks { id } }',
      );
      expect(result.errors).toBeUndefined();
      const blocks = result.data?.myTimeBlocks as unknown[];
      expect(blocks).toHaveLength(1);
    });

    it('filters by containsDay', async () => {
      const { id: userId } = await seedUser(db, 'tb-containsday@example.com');
      const at = await seedActivityType(db, userId);
      await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: at.id,
            daysOfWeek: [1, 2],
            startTime: '09:00',
            endTime: '10:00',
          },
        },
      );
      await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: at.id,
            daysOfWeek: [5, 6],
            startTime: '10:00',
            endTime: '11:00',
          },
        },
      );

      // Day 1 (Monday) should only return the first block
      const result = await gql(
        testSchema,
        db,
        userId,
        'query($day: Int) { myTimeBlocks(containsDay: $day) { id daysOfWeek } }',
        { day: 1 },
      );
      expect(result.errors).toBeUndefined();
      const blocks = result.data?.myTimeBlocks as Array<{
        daysOfWeek: number[];
      }>;
      expect(blocks.every((b) => b.daysOfWeek.includes(1))).toBe(true);
    });

    it('filters by activityTypeId', async () => {
      const { id: userId } = await seedUser(db, 'tb-atfilter@example.com');
      const at1 = await seedActivityType(db, userId, 'Work');
      const at2 = await seedActivityType(db, userId, 'Exercise');
      await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: at1.id,
            daysOfWeek: [1],
            startTime: '09:00',
            endTime: '10:00',
          },
        },
      );
      await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: at2.id,
            daysOfWeek: [2],
            startTime: '11:00',
            endTime: '12:00',
          },
        },
      );

      const result = await gql(
        testSchema,
        db,
        userId,
        'query($id: ID) { myTimeBlocks(activityTypeId: $id) { id } }',
        { id: at2.id },
      );
      expect(result.errors).toBeUndefined();
      expect((result.data?.myTimeBlocks as unknown[]).length).toBe(1);
    });
  });

  // ─── myCreateTimeBlock ────────────────────────────────────────────────────────

  describe('myCreateTimeBlock', () => {
    it('throws when not authenticated', async () => {
      const { id: userId } = await seedUser(db, 'create-tb-seed@example.com');
      const at = await seedActivityType(db, userId);
      const result = await gql(
        testSchema,
        db,
        '',
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: at.id,
            daysOfWeek: [1],
            startTime: '09:00',
            endTime: '10:00',
          },
        },
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('creates a time block and returns it', async () => {
      const { id: userId } = await seedUser(db, 'create-tb@example.com');
      const at = await seedActivityType(db, userId);
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id startTime endTime daysOfWeek } }',
        {
          input: {
            activityTypeId: at.id,
            daysOfWeek: [1, 2, 3],
            startTime: '09:00',
            endTime: '17:00',
          },
        },
      );
      expect(result.errors).toBeUndefined();
      const block = result.data?.myCreateTimeBlock as { startTime: string };
      expect(block.startTime).toBe('09:00');
    });
  });

  // ─── myUpdateTimeBlock ────────────────────────────────────────────────────────

  describe('myUpdateTimeBlock', () => {
    it('updates time block fields', async () => {
      const { id: userId } = await seedUser(db, 'update-tb@example.com');
      const at = await seedActivityType(db, userId);
      const createResult = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: at.id,
            daysOfWeek: [1],
            startTime: '09:00',
            endTime: '10:00',
          },
        },
      );
      const blockId = (createResult.data?.myCreateTimeBlock as { id: string })
        .id;

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTimeBlockArgs!) { myUpdateTimeBlock(input: $input) { id startTime endTime } }',
        { input: { id: blockId, startTime: '10:00', endTime: '11:00' } },
      );
      expect(result.errors).toBeUndefined();
      const updated = result.data?.myUpdateTimeBlock as {
        startTime: string;
        endTime: string;
      };
      expect(updated.startTime).toBe('10:00');
      expect(updated.endTime).toBe('11:00');
    });

    it('throws when time block not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-tb-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTimeBlockArgs!) { myUpdateTimeBlock(input: $input) { id } }',
        {
          input: {
            id: '00000000-0000-0000-0000-000000000000',
            startTime: '09:00',
          },
        },
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when time block belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'update-tb-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(db, 'update-tb-other@example.com');
      const otherAt = await seedActivityType(db, otherId);
      const createResult = await gql(
        testSchema,
        db,
        otherId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: otherAt.id,
            daysOfWeek: [1],
            startTime: '09:00',
            endTime: '10:00',
          },
        },
      );
      const blockId = (createResult.data?.myCreateTimeBlock as { id: string })
        .id;

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateTimeBlockArgs!) { myUpdateTimeBlock(input: $input) { id } }',
        { input: { id: blockId, startTime: '11:00' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myDeleteTimeBlock ────────────────────────────────────────────────────────

  describe('myDeleteTimeBlock', () => {
    it('deletes a time block and returns true', async () => {
      const { id: userId } = await seedUser(db, 'delete-tb@example.com');
      const at = await seedActivityType(db, userId);
      const createResult = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: at.id,
            daysOfWeek: [1],
            startTime: '09:00',
            endTime: '10:00',
          },
        },
      );
      const blockId = (createResult.data?.myCreateTimeBlock as { id: string })
        .id;

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteTimeBlock(id: $id) }',
        { id: blockId },
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myDeleteTimeBlock).toBe(true);
    });

    it('throws when time block not found', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-tb-notfound@example.com',
      );
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation { myDeleteTimeBlock(id: "00000000-0000-0000-0000-000000000000") }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not found/i);
    });

    it('throws Forbidden when time block belongs to another user', async () => {
      const { id: userId } = await seedUser(
        db,
        'delete-tb-forbidden@example.com',
      );
      const { id: otherId } = await seedUser(db, 'delete-tb-other@example.com');
      const otherAt = await seedActivityType(db, otherId);
      const createResult = await gql(
        testSchema,
        db,
        otherId,
        'mutation($input: CreateTimeBlockArgs!) { myCreateTimeBlock(input: $input) { id } }',
        {
          input: {
            activityTypeId: otherAt.id,
            daysOfWeek: [3],
            startTime: '09:00',
            endTime: '10:00',
          },
        },
      );
      const blockId = (createResult.data?.myCreateTimeBlock as { id: string })
        .id;

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteTimeBlock(id: $id) }',
        { id: blockId },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });
});
