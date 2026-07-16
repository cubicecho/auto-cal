import { users } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import type { GraphQLObjectType } from 'graphql';
import type { Context } from '../../context.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

export function applyProfileResolvers(
  queryFields: Fields,
  mutationFields: Fields,
): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myProfile!.resolve = async (_parent, _args, context: Context) => {
    if (!context.userId) throw new Error('Not authenticated');
    return context.db.query.users.findFirst({
      where: { id: context.userId },
    });
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUpdateProfile!.resolve = async (
    _parent,
    args: { timezone: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    if (!Intl.supportedValuesOf('timeZone').includes(args.timezone)) {
      throw new Error(`Invalid timezone: ${args.timezone}`);
    }
    await context.db
      .update(users)
      .set({ timezone: args.timezone, updatedAt: new Date() })
      .where(eq(users.id, context.userId));
    return true;
  };
}
