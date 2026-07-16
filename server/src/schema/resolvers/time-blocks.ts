import { timeBlocks } from '@auto-cal/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { GraphQLObjectType } from 'graphql';
import { z } from 'zod';
import type { Context } from '../../context.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import { CreateTimeBlockInput } from '../validators.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

const UpdateTimeBlockInput = z
  .object({
    id: z.string().uuid(),
    activityTypeId: z.string().uuid().optional(),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((days) => new Set(days).size === days.length, {
        message: 'Days of week must be unique',
      })
      .optional(),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    priority: z.number().int().min(0).max(100).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) return data.endTime > data.startTime;
      return true;
    },
    { message: 'End time must be after start time', path: ['endTime'] },
  );

export function applyTimeBlockResolvers(
  queryFields: Fields,
  mutationFields: Fields,
): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myTimeBlocks!.resolve = async (
    _parent,
    args: { activityTypeId?: string; containsDay?: number },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const where: Record<string, unknown> = { userId: context.userId };
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
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCreateTimeBlock!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = CreateTimeBlockInput.parse(args.input);
    const [block] = await context.db
      .insert(timeBlocks)
      .values({
        userId: context.userId,
        activityTypeId: input.activityTypeId,
        daysOfWeek: input.daysOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        priority: input.priority,
      })
      .returning();
    if (!block) throw new Error('Failed to create time block');
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    return block;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUpdateTimeBlock!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = UpdateTimeBlockInput.parse(args.input);
    const existing = await context.db.query.timeBlocks.findFirst({
      where: { id: input.id },
    });
    if (!existing) throw new Error(`TimeBlock ${input.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');
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
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    return updated;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myDeleteTimeBlock!.resolve = async (
    _parent,
    args: { id: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const existing = await context.db.query.timeBlocks.findFirst({
      where: { id: args.id },
    });
    if (!existing) throw new Error(`Time block ${args.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');
    await context.db.delete(timeBlocks).where(eq(timeBlocks.id, args.id));
    runSchedulerWriteback(context.db, context.userId).catch(console.error);
    return true;
  };
}
