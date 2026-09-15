import { users } from '@auto-cal/db/schema';
import { z } from 'zod';
import { signMagicToken, signSessionToken, verifyToken } from '../../auth.ts';
import { magicLinkExposed, magicLinkRequired } from '../../config.ts';
import type { Context } from '../../context.ts';
import { badUserInput } from '../../errors.ts';
import type { MutationMap } from './types.ts';

/**
 * Registration is open: completing a sign-in for an address never seen before
 * creates the account.
 */
async function findOrCreateUser(db: Context['db'], email: string) {
  const existing = await db.query.users.findFirst({ where: { email } });
  if (existing) return existing;
  const [created] = await db.insert(users).values({ email }).returning();
  if (!created) throw new Error('Failed to create user');
  return created;
}

export const authMutations: MutationMap<
  'requestMagicLink' | 'verifyMagicLink'
> = {
  requestMagicLink: async (_parent, args, context) => {
    const email = z.email().parse(args.email).toLowerCase();

    // No-link mode (AUTH_MAGIC_LINK=false): the address alone is the
    // credential, and a normal session JWT comes straight back. Secure local
    // networks only — see config.ts.
    if (!magicLinkRequired()) {
      const user = await findOrCreateUser(context.db, email);
      console.log(`[auth] Magic links are off; signed ${email} in directly.`);
      return {
        ok: true,
        magicLink: null,
        token: await signSessionToken(user.id, user.email),
        userId: user.id,
      };
    }

    const token = await signMagicToken(email);
    const magicLink = `${context.appBaseUrl}/auth/verify?token=${token}`;

    console.log(`\n[auth] Magic link for ${email}:\n${magicLink}\n`);

    // Only hand the link back to the client when direct login is enabled
    // (non-production, or EXPOSE_MAGIC_LINK on local/secure networks). Otherwise
    // it must be delivered out-of-band (email) so it can't be guessed.
    return {
      ok: true,
      magicLink: magicLinkExposed() ? magicLink : null,
      token: null,
      userId: null,
    };
  },

  verifyMagicLink: async (_parent, args, context) => {
    const payload = await verifyToken(args.token);
    // Coded, not bare: this is the message the login screen shows, and
    // `formatError` replaces uncoded ones with "Internal server error" in
    // production. BAD_USER_INPUT rather than UNAUTHENTICATED — the client
    // reads the latter as session expiry and drops the stored token.
    if (!payload?.email) throw badUserInput('Invalid or expired magic link');

    const user = await findOrCreateUser(context.db, payload.email);
    const sessionToken = await signSessionToken(user.id, user.email);
    return { token: sessionToken, userId: user.id };
  },
};
