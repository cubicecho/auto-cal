import { users } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '../../errors.ts';
import type { MutationMap } from './types.ts';

export const profileMutations: MutationMap<'myUpdateProfile'> = {
  myUpdateProfile: async (_parent, args, context) => {
    const userId = requireUser(context);
    if (!Intl.supportedValuesOf('timeZone').includes(args.timezone)) {
      throw new Error(`Invalid timezone: ${args.timezone}`);
    }
    await context.db
      .update(users)
      .set({ timezone: args.timezone, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return true;
  },
};
