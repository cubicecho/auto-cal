import { db } from '@auto-cal/db';
import { buildSchema } from '@vantreeseba/drizzle-graphql';
import type { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { buildSchemaConfig } from './build-config.ts';
import { applyCustomResolvers } from './resolvers/index.ts';

const { schema: drizzleSchema, entities } = buildSchema(db, buildSchemaConfig);

// Block all auto-generated drizzle-graphql resolvers that aren't user-scoped.
// Only fields starting with "my" and the two public auth mutations are allowed.
const PUBLIC_MUTATIONS = new Set(['requestMagicLink', 'verifyMagicLink']);

function blockUnscopedResolvers(schema: GraphQLSchema): void {
  for (const typeName of ['Query', 'Mutation']) {
    const type = schema.getType(typeName) as GraphQLObjectType | undefined;
    if (!type) continue;
    for (const [fieldName, field] of Object.entries(type.getFields())) {
      const isAllowed =
        fieldName.startsWith('my') || PUBLIC_MUTATIONS.has(fieldName);
      if (!isAllowed) {
        field.resolve = () => {
          throw new Error(
            `Field "${fieldName}" is not available. Use the user-scoped resolvers instead.`,
          );
        };
      }
    }
  }
}

export const schema = applyCustomResolvers(drizzleSchema);
blockUnscopedResolvers(schema);

export { entities };
