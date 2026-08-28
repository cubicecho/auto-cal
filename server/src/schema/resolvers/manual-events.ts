import { manualEvents } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import { badUserInput, requireUser } from '../../errors.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import {
  CreateManualEventInput,
  UpdateManualEventInput,
} from '../validators.ts';
import { loadOwned } from './load.ts';
import { publishDataChanged } from './subscriptions.ts';
import type { MutationMap } from './types.ts';

// `myManualEvents` is not here. It is the generated `manualEvents` query,
// renamed and scoped to the caller by `scopeRootFields` (../scope.ts), so the
// range filter callers used to pass as `rangeStart`/`rangeEnd` is now the
// generated `where` — see QUERY_SCOPE. Ordering comes from `defaults` in
// build-config.ts.
export const manualEventMutations: MutationMap<
  'myCreateManualEvent' | 'myUpdateManualEvent' | 'myDeleteManualEvent'
> = {
  myCreateManualEvent: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = CreateManualEventInput.parse(args.input);

    const [event] = await context.db
      .insert(manualEvents)
      .values({
        userId,
        title: input.title,
        description: input.description ?? null,
        color: input.color ?? null,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
      })
      .returning();
    if (!event) throw new Error('Failed to create manual event');

    // A manual event blocks the scheduler from placing work over its slot, so
    // adding one can displace what is already scheduled.
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'manualEvent', [event.id]);
    return event;
  },

  myUpdateManualEvent: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = UpdateManualEventInput.parse(args.input);
    const existing = await loadOwned(context, 'manualEvents', input.id, userId);

    // Guard the end-after-start invariant against a partial update, which can
    // move one endpoint past the other without either being invalid alone.
    const nextStart = input.startAt
      ? new Date(input.startAt)
      : existing.startAt;
    const nextEnd = input.endAt ? new Date(input.endAt) : existing.endAt;
    if (nextEnd <= nextStart) {
      throw badUserInput('End must be after start');
    }

    const [updated] = await context.db
      .update(manualEvents)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...('description' in input && { description: input.description }),
        ...('color' in input && { color: input.color }),
        ...(input.startAt !== undefined && { startAt: nextStart }),
        ...(input.endAt !== undefined && { endAt: nextEnd }),
        updatedAt: new Date(),
      })
      .where(eq(manualEvents.id, input.id))
      .returning();
    if (!updated) throw new Error(`Failed to update manual event ${input.id}`);

    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'manualEvent', [updated.id]);
    return updated;
  },

  myDeleteManualEvent: async (_parent, args, context) => {
    const userId = requireUser(context);
    await loadOwned(context, 'manualEvents', args.id, userId);
    await context.db.delete(manualEvents).where(eq(manualEvents.id, args.id));

    // Freeing the slot lets the scheduler backfill it on the next writeback.
    runSchedulerWriteback(context.db, userId).catch(console.error);
    publishDataChanged(userId, 'manualEvent', [args.id]);
    return true;
  },
};
