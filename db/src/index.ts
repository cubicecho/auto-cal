import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
// The exported type stays wide. Narrowing it to PostgresJsDatabase surfaces 24
// pre-existing type errors — 9 in src/ resolvers, the rest in tests that hand a
// PGLite instance to a `DB`-typed function — so it is tightened separately in
// cubicecho/auto-cal#66.
//
// @ts-expect-error drizzle-orm 1.0-beta removed `schema` from DrizzlePgConfig types but it remains valid at runtime for relational queries
// biome-ignore lint/suspicious/noExplicitAny: see the note above
const db: any = drizzle({ client, schema, relations });

await migrate(db, { migrationsFolder });

export { db };
export type DB = typeof db;

export { schema };
export * from './schema.ts';
