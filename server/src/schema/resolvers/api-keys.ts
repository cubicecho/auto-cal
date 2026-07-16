import { apiKeys } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import type { GraphQLObjectType } from 'graphql';
import { generateApiKey } from '../../api-keys.ts';
import type { Context } from '../../context.ts';
import { MyCreateApiKeyInput } from '../validators.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

export function applyApiKeyResolvers(
  queryFields: Fields,
  mutationFields: Fields,
): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myApiKeys!.resolve = async (_parent, _args, context: Context) => {
    if (!context.userId) throw new Error('Not authenticated');
    return context.db.query.apiKeys.findMany({
      where: { userId: context.userId, revokedAt: { isNull: true } },
      orderBy: { createdAt: 'desc' },
    });
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCreateApiKey!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    if (context.apiKey) {
      throw new Error('API keys cannot manage other keys');
    }
    const input = MyCreateApiKeyInput.parse(args.input);
    const { token, hash, prefix } = generateApiKey();

    const [row] = await context.db
      .insert(apiKeys)
      .values({
        userId: context.userId,
        name: input.name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: input.scopes,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      })
      .returning();

    if (!row) throw new Error('Failed to create API key');

    return { apiKey: row, token };
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myRevokeApiKey!.resolve = async (
    _parent,
    args: { id: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    if (context.apiKey) {
      throw new Error('API keys cannot manage other keys');
    }
    const key = await context.db.query.apiKeys.findFirst({
      where: { id: args.id },
    });
    if (!key) throw new Error(`ApiKey ${args.id} not found`);
    if (key.userId !== context.userId) throw new Error('Forbidden');

    await context.db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, args.id));

    return true;
  };
}
