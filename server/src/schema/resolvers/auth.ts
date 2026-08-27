import { users } from '@auto-cal/db/schema';
import { z } from 'zod';
import { signMagicToken, signSessionToken, verifyToken } from '../../auth.ts';
import { magicLinkExposed } from '../../config.ts';
import { badUserInput } from '../../errors.ts';
import type { MutationMap } from './types.ts';

export const authMutations: MutationMap<
  'requestMagicLink' | 'verifyMagicLink'
> = {
  requestMagicLink: async (_parent, args, context) => {
    const email = z.string().email().parse(args.email).toLowerCase();
    const token = await signMagicToken(email);
    const magicLink = `${context.appBaseUrl}/auth/verify?token=${token}`;

    console.log(`\n[auth] Magic link for ${email}:\n${magicLink}\n`);

    // Only hand the link back to the client when direct login is enabled
    // (non-production, or EXPOSE_MAGIC_LINK on local/secure networks). Otherwise
    // it must be delivered out-of-band (email) so it can't be guessed.
    return { ok: true, magicLink: magicLinkExposed() ? magicLink : null };
  },

  verifyMagicLink: async (_parent, args, context) => {
    const payload = await verifyToken(args.token);
    // Coded, not bare: this is the message the login screen shows, and
    // `formatError` replaces uncoded ones with "Internal server error" in
    // production. BAD_USER_INPUT rather than UNAUTHENTICATED — the client
    // reads the latter as session expiry and drops the stored token.
    if (!payload?.email) throw badUserInput('Invalid or expired magic link');

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
  },
};
