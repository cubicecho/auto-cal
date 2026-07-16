# Deployment

## Docker

Single-stage image — build must run **outside** Docker before `docker build`:

```bash
npm run build       # codegen + vite + tsc
docker build -t auto-cal .
```

The Dockerfile installs only production deps, then copies:
- `server` — TypeScript source (run with `--experimental-strip-types`)
- `db` — TypeScript source + migration files
- `client/dist` — built static assets

Migrations run automatically when the server starts — `db/src/index.ts` calls `migrate()` for whichever backend is active before exporting `db`. The Dockerfile `CMD` is:

```sh
node --experimental-strip-types server/src/index.ts
```

**Do not use the separate `src/migrator.ts` script in Docker.** When `DATABASE_URL` is set, postgres.js keeps its connection pool open after `migrate()` returns, so the migrator process never exits. The `&&`-chained CMD would hang forever before the server starts. `db/src/index.ts` already handles migrations for both backends.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `3001`) |
| `DATABASE_URL` | Conditional | Postgres connection string (e.g. `postgresql://user:pass@host:5432/db`); when set, uses `postgres.js` driver |
| `PGLITE_DATA_DIR` | Conditional | Path to PGLite data directory; required when `DATABASE_URL` is not set |
| `NODE_ENV` | No | `production` / `development` |
| `EXPOSE_MAGIC_LINK` | No | `1`/`true`/`yes` returns the magic link directly in the `requestMagicLink` response (dev-style passwordless login) even in production. For local/secure networks only — never enable on a public deployment. |
| `BYPASS_AUTH_UUID` | No | An existing user UUID accepted as a Bearer token in any environment; passwordless access for that one user. Local/secure networks only. |

## Docker Compose Files

| File | Backend | Use case |
|------|---------|----------|
| `docker-compose.yml` | Real Postgres (recommended) | Production — no idle CPU spin |
| `docker-compose.postgres.yml` | Real Postgres | Same as above, explicit name |
| `docker-compose.pglite.yml` | PGLite (WASM) | Single-binary dev/demo only |

**Use `docker-compose.yml` (or `docker-compose.postgres.yml`) for any real deployment.**

## PGLite Idle CPU Problem

PGLite compiles PostgreSQL to WebAssembly via Emscripten. Emscripten simulates PostgreSQL's event loop with `setTimeout(fn, 0)` — a busy-wait that fires on every event loop tick. Real Postgres uses OS-level sleep between background worker wakeups; the WASM port cannot, so the Node.js process consumes measurable CPU even with zero client activity.

**Root cause:** `postgres.js` in `@electric-sql/pglite` contains `setTimeout(MainLoop.runner, 0)` — Emscripten's unconditional main-loop spin.

**Fix:** Use `DATABASE_URL` with a real Postgres instance (see `docker-compose.yml`). PGLite is appropriate only for local development or single-user demos where the CPU overhead is acceptable.

At startup the server logs which backend it selected — `[auto-cal] DB backend: Postgres (via DATABASE_URL)` or `[auto-cal] DB backend: PGLite (PGLITE_DATA_DIR=…)` — and additionally warns when PGLite is used under `NODE_ENV=production`. If a deployment that you believe is on Postgres is burning idle CPU, check that log line first: it almost always means the app container never received `DATABASE_URL` and silently fell back to PGLite while the Postgres container sits unused.

**Silent-fallback footgun (fixed):** the Dockerfile previously baked in `ENV PGLITE_DATA_DIR=/app/pgdata`, so running the image without `DATABASE_URL` quietly dropped to PGLite. That default has been removed — a run with neither `DATABASE_URL` nor `PGLITE_DATA_DIR` now fails fast with `Set DATABASE_URL or PGLITE_DATA_DIR` instead of busy-looping. `docker-compose.pglite.yml` sets `PGLITE_DATA_DIR` explicitly, so the embedded-DB mode is unaffected.

## Switching to Full Postgres

Set `DATABASE_URL` — the runtime automatically selects the `postgres.js` driver over PGLite. See `.env.example` and `docker-compose.yml`.

## PGLite (Local / Embedded)

Data is persisted to the volume at `/app/pgdata`. No separate database server is needed. Do not use in production — see idle CPU problem above.
