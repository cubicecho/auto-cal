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

/** Reads a positive-integer env var, falling back when unset or unparseable. */
function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(
      `[auto-cal] ignoring ${name}="${raw}" — expected a positive integer`,
    );
    return fallback;
  }
  return parsed;
}

/**
 * Pool sizing. postgres.js defaults to `max: 10` and *queues* anything beyond
 * it, which is why the overlapping `runSchedulerWriteback` calls never fail —
 * 50 concurrent writebacks for one user complete cleanly on a 10-connection
 * pool. The default is kept, but stated explicitly and made tunable, because a
 * single Postgres has a global `max_connections` (100 by default) and the right
 * number is `max_connections / instances`, not a per-process constant. See
 * `.agents/deployment.md`.
 */
const client = postgres(databaseUrl, {
  max: intEnv('DATABASE_POOL_MAX', 10),
  // Retire idle connections so a scaled-down instance stops holding server-side
  // slots. 0 (postgres.js's default) keeps them open forever.
  idle_timeout: intEnv('DATABASE_IDLE_TIMEOUT', 30),
  // Fail a boot that cannot reach the database rather than hanging on it.
  connect_timeout: intEnv('DATABASE_CONNECT_TIMEOUT', 10),

  // postgres.js's default `onnotice` dumps the raw notice object to stdout, so
  // every boot logged a full `{severity: 'NOTICE', code: '42P06', ...}` for
  // drizzle's own `CREATE SCHEMA IF NOT EXISTS drizzle`. Swallow the
  // "already exists" pair the migrator provokes on every run after the first,
  // and print anything else as one line.
  onnotice: (notice) => {
    // 42P06 duplicate_schema, 42P07 duplicate_table
    if (notice.code === '42P06' || notice.code === '42P07') return;
    console.warn(
      `[auto-cal] postgres notice ${notice.code}: ${notice.message}`,
    );
  },
});
// The exported type stays wide. Narrowing it to PostgresJsDatabase surfaces 24
// pre-existing type errors — 9 in src/ resolvers, the rest in tests that hand a
// PGLite instance to a `DB`-typed function — so it is tightened separately in
// cubicecho/auto-cal#66.
//
// biome-ignore lint/suspicious/noExplicitAny: see the note above
const db: any = drizzle({ client, relations });

await migrate(db, { migrationsFolder });

export { db };
export type DB = typeof db;

/**
 * Close the pool. Nothing in the server needs this — the process owns the
 * connection for its lifetime — but a one-shot script does: postgres.js keeps
 * the event loop alive, so `migrator.ts` hung forever after printing its
 * success line until it started calling this.
 */
export async function closeDb(): Promise<void> {
  await client.end();
}

export { schema };
export * from './schema.ts';
