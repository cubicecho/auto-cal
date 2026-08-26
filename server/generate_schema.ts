/**
 * Generates src/__generated__/schema.graphql from the Drizzle schema.
 *
 * Uses an in-memory PGlite instance — no PGLITE_DATA_DIR or DATABASE_URL
 * required. buildSchema only reads db._.fullSchema and db._.relations
 * (static JS objects set at drizzle() construction time), so no real
 * database connection or migrations are needed.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relations } from '@auto-cal/db/relations';
import * as schema from '@auto-cal/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { buildSchema } from '@vantreeseba/drizzle-graphql';
import { drizzle } from 'drizzle-orm/pglite';
import { printSchema } from 'graphql';
import { buildSchemaConfig } from './src/schema/build-config.ts';
import { applyCustomResolvers } from './src/schema/resolvers/index.ts';

const client = new PGlite(); // in-memory, no filesystem
await client.waitReady;

// @ts-expect-error drizzle-orm 1.0-beta removed `schema` from DrizzlePgConfig types
const db = drizzle({ client, schema, relations });

const { schema: drizzleSchema } = buildSchema(db, buildSchemaConfig);

const fullSchema = applyCustomResolvers(drizzleSchema);

const __dirname = dirname(fileURLToPath(import.meta.url));
const generatedDir = join(__dirname, 'src/__generated__');
mkdirSync(generatedDir, { recursive: true });
writeFileSync(join(generatedDir, 'schema.graphql'), printSchema(fullSchema));
console.log('Generated src/__generated__/schema.graphql');
