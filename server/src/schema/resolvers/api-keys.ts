import { apiKeys } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import { generateApiKey } from '../../api-keys.ts';
import { forbidden, requireUser } from '../../errors.ts';
import { MyCreateApiKeyInput } from '../validators.ts';
import { loadOwned } from './load.ts';
import type { MutationMap } from './types.ts';

/**
 * A key may not mint or revoke keys — that would let a leaked key extend its
 * own lifetime past the revocation it was issued under. Coded FORBIDDEN rather
 * than thrown bare so the message survives `formatError` in production.
 */
function rejectApiKeyCaller(context: { apiKey?: unknown }): void {
  if (context.apiKey) throw forbidden('API keys cannot manage other keys');
}

export const apiKeyMutations: MutationMap<'myCreateApiKey' | 'myRevokeApiKey'> =
  {
    myCreateApiKey: async (_parent, args, context) => {
      const userId = requireUser(context);
      rejectApiKeyCaller(context);
      const input = MyCreateApiKeyInput.parse(args.input);
      const { token, hash, prefix } = generateApiKey();

      const [row] = await context.db
        .insert(apiKeys)
        .values({
          userId,
          name: input.name,
          keyHash: hash,
          keyPrefix: prefix,
          scopes: input.scopes,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        })
        .returning();

      if (!row) throw new Error('Failed to create API key');

      return { apiKey: row, token };
    },

    myRevokeApiKey: async (_parent, args, context) => {
      const userId = requireUser(context);
      rejectApiKeyCaller(context);
      await loadOwned(context, 'apiKeys', args.id, userId);

      await context.db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, args.id));

      return true;
    },
  };
