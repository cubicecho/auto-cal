import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PgAsyncDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { relations } from './relations.ts';
import * as schema from './schema.ts';

const databaseUrl = process.env.DATABASE_URL;

// Postgres is the only runtime backend. PGLite (WASM) used to be the
// zero-config fallback, but it drives PostgreSQL's event loop with
// `setTimeout(fn, 0)` — a busy-wait that burns CPU at idle — so a deploy that
// lost its DATABASE_URL silently degraded instead of failing. Fail loudly.
// Tests still use PGLite, but they construct it themselves (see
// `server/test/schema/resolvers/test-helpers.ts`) and never reach this module.
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required. Postgres is the only supported backend — ' +
      'run `npm run db:up` for a local instance, or see .agents/deployment.md.',
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, '../drizzle');

console.log('[auto-cal] DB backend: Postgres (via DATABASE_URL)');

const client = postgres(databaseUrl);
const db = drizzle({ client, relations });

await migrate(db, { migrationsFolder });

export { db };

/**
 * The database type shared code is written against.
 *
 * Deliberately the driver-agnostic base rather than `typeof db`: the server
 * always runs on postgres.js, but `server/test/**` passes in-memory PGLite
 * instances to the same functions, and the two drivers differ only in their
 * query-result HKT. Widening here is what lets a resolver keep its types
 * without the tests casting at every call site.
 */
export type DB = PgAsyncDatabase<PgQueryResultHKT, typeof relations>;

export { schema };
export * from './schema.ts';
