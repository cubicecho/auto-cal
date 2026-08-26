import { timeBlocks } from '@auto-cal/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireOwner, requireUser } from '../../errors.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import { CreateTimeBlockInput, UpdateTimeBlockInput } from '../validators.ts';
import { publishDataChanged } from './subscriptions.ts';
import type { MutationMap, QueryMap } from './types.ts';

export const timeBlockQueries: QueryMap<'myTimeBlocks'> = {
  myTimeBlocks: async (_parent, args, context) => {
    const userId = requireUser(context);
    const where: Record<string, unknown> = { userId: userId };
    if (args.activityTypeId) where.activityTypeId = args.activityTypeId;
    if (args.containsDay !== undefined && args.containsDay !== null) {
      const day = args.containsDay;
      where.RAW = (t: { daysOfWeek: unknown }) =>
        sql`${t.daysOfWeek} @> ARRAY[${sql.param(day)}]::integer[]`;
    }
    return context.db.query.timeBlocks.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
  },
};

export const timeBlockMutations: MutationMap<
  'myCreateTimeBlock' | 'myUpdateTimeBlock' | 'myDeleteTimeBlock'
> = {
  myCreateTimeBlock: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = CreateTimeBlockInput.parse(args.input);
    const [block] = await context.db
      .insert(timeBlocks)
      .values({
        userId: userId,
        activityTypeId: input.activityTypeId,
        daysOfWeek: input.daysOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        priority: input.priority,
      })
      .returning();
    if (!block) throw new Error('Failed to create time block');
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'timeBlock', [block.id]);
    return block;
  },

  myUpdateTimeBlock: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = UpdateTimeBlockInput.parse(args.input);
    requireOwner(
      await context.db.query.timeBlocks.findFirst({
        where: { id: input.id },
      }),
      'TimeBlock',
      input.id,
      userId,
    );
    const [updated] = await context.db
      .update(timeBlocks)
      .set({
        ...(input.activityTypeId !== undefined && {
          activityTypeId: input.activityTypeId,
        }),
        ...(input.daysOfWeek !== undefined && { daysOfWeek: input.daysOfWeek }),
        ...(input.startTime !== undefined && { startTime: input.startTime }),
        ...(input.endTime !== undefined && { endTime: input.endTime }),
        ...(input.priority !== undefined && { priority: input.priority }),
        updatedAt: new Date(),
      })
      .where(eq(timeBlocks.id, input.id))
      .returning();
    if (!updated) throw new Error(`Failed to update time block ${input.id}`);
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'timeBlock', [updated.id]);
    return updated;
  },

  myDeleteTimeBlock: async (_parent, args, context) => {
    const userId = requireUser(context);
    requireOwner(
      await context.db.query.timeBlocks.findFirst({
        where: { id: args.id },
      }),
      'Time block',
      args.id,
      userId,
    );
    await context.db.delete(timeBlocks).where(eq(timeBlocks.id, args.id));
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'timeBlock', [args.id]);
    return true;
  },
};
