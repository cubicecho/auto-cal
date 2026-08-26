import { apiKeys } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import { generateApiKey } from '../../api-keys.ts';
import { requireOwner, requireUser } from '../../errors.ts';
import { MyCreateApiKeyInput } from '../validators.ts';
import type { MutationMap, QueryMap } from './types.ts';

export const apiKeyQueries: QueryMap<'myApiKeys'> = {
  myApiKeys: async (_parent, _args, context) => {
    const userId = requireUser(context);
    return context.db.query.apiKeys.findMany({
      where: { userId: userId, revokedAt: { isNull: true } },
      orderBy: { createdAt: 'desc' },
    });
  },
};

export const apiKeyMutations: MutationMap<'myCreateApiKey' | 'myRevokeApiKey'> =
  {
    myCreateApiKey: async (_parent, args, context) => {
      const userId = requireUser(context);
      if (context.apiKey) {
        throw new Error('API keys cannot manage other keys');
      }
      const input = MyCreateApiKeyInput.parse(args.input);
      const { token, hash, prefix } = generateApiKey();

      const [row] = await context.db
        .insert(apiKeys)
        .values({
          userId: userId,
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
      if (context.apiKey) {
        throw new Error('API keys cannot manage other keys');
      }
      requireOwner(
        await context.db.query.apiKeys.findFirst({
          where: { id: args.id },
        }),
        'ApiKey',
        args.id,
        userId,
      );

      await context.db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, args.id));

      return true;
    },
  };
