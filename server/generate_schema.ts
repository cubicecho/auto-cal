/**
 * Generates src/__generated__/schema.graphql from the Drizzle schema.
 *
 * No database is contacted. buildSchema only reads db._.relations — a static JS
 * object set at drizzle() construction time — and postgres.js connects lazily on
 * first query, so a placeholder DSN is enough.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relations } from '@auto-cal/db/relations';
import { buildSchema } from '@vantreeseba/drizzle-graphql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { printSchema } from 'graphql';
import postgres from 'postgres';
import { buildSchemaConfig } from './src/schema/build-config.ts';
import { applyCustomResolvers } from './src/schema/resolvers/index.ts';

// Never connected: no query is issued, so the DSN is never resolved.
const client = postgres('postgresql://unused/unused');

const db = drizzle({ client, relations });

const { schema: drizzleSchema } = buildSchema(db, buildSchemaConfig);

const fullSchema = applyCustomResolvers(drizzleSchema);

const __dirname = dirname(fileURLToPath(import.meta.url));
const generatedDir = join(__dirname, 'src/__generated__');
mkdirSync(generatedDir, { recursive: true });
writeFileSync(join(generatedDir, 'schema.graphql'), printSchema(fullSchema));
console.log('Generated src/__generated__/schema.graphql');
