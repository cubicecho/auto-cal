import { users } from '@auto-cal/db/schema';
import type { GraphQLObjectType } from 'graphql';
import { z } from 'zod';
import { signMagicToken, signSessionToken, verifyToken } from '../../auth.ts';
import type { Context } from '../../context.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

export function applyAuthResolvers(mutationFields: Fields): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.requestMagicLink!.resolve = async (
    _parent,
    args: { email: string },
    context: Context,
  ) => {
    const email = z.string().email().parse(args.email).toLowerCase();
    const token = await signMagicToken(email);
    const magicLink = `${context.appBaseUrl}/auth/verify?token=${token}`;

    if (process.env.NODE_ENV === 'production') {
      console.log(`[auth] Magic link for ${email}: ${magicLink}`);
      return { ok: true, magicLink: null };
    }

    console.log(`\n[auth] Magic link for ${email}:\n${magicLink}\n`);
    return { ok: true, magicLink };
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.verifyMagicLink!.resolve = async (
    _parent,
    args: { token: string },
    context: Context,
  ) => {
    const payload = await verifyToken(args.token);
    if (!payload?.email) throw new Error('Invalid or expired magic link');

    let user = await context.db.query.users.findFirst({
      where: { email: payload.email },
    });

    if (!user) {
      const [created] = await context.db
        .insert(users)
        .values({ email: payload.email })
        .returning();
      if (!created) throw new Error('Failed to create user');
      user = created;
    }

    const sessionToken = await signSessionToken(user.id, user.email);
    return { token: sessionToken, userId: user.id };
  };
}
