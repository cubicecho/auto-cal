import { users } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '../../errors.ts';
import type { MutationMap, QueryMap } from './types.ts';

export const profileQueries: QueryMap<'myProfile'> = {
  myProfile: async (_parent, _args, context) => {
    const userId = requireUser(context);
    return (
      (await context.db.query.users.findFirst({
        where: { id: userId },
      })) ?? null
    );
  },
};

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
