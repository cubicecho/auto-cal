import { db } from '@auto-cal/db';
import { buildSchema } from '@vantreeseba/drizzle-graphql';
import { buildSchemaConfig } from './build-config.ts';
import { applyCustomResolvers } from './resolvers/index.ts';

const { schema: drizzleSchema } = buildSchema(db, buildSchemaConfig);

// applyCustomResolvers ends by removing every root field that is not `my*` or
// an explicit public mutation (see PUBLIC_MUTATIONS there). Unscoped generated
// queries used to survive here with a throwing resolver attached; they are now
// absent from the schema, so they fail validation instead of execution — and,
// because the removal happens inside applyCustomResolvers, generate_schema.ts
// and the resolver tests see the same surface this server does.
export const schema = applyCustomResolvers(drizzleSchema);
