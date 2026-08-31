import { closeDb, db } from './index.ts';

// Importing `./index.ts` applies every pending migration — it runs `migrate()`
// at module scope so the server can never serve a stale schema. This file is
// the explicit entry point for doing only that (`npm run db:migrate`).
//
// It used to call `migrate()` a second time itself, against a cwd-relative
// `./drizzle/` that only resolved when run from `db/`, and then never exited:
// postgres.js holds the event loop open until the pool is closed, so the script
// printed its success line and hung. `closeDb()` is the fix; the redundant
// second migrate is gone.
void db;

console.log('Migrations complete');

await closeDb();
