# Deployment

## Docker

Single-stage image — build must run **outside** Docker before `docker build`:

```bash
npm run build       # codegen + vite + tsc
docker build -t auto-cal .
```

The Dockerfile installs only production deps, then copies:
- `packages/server` — TypeScript source (run with `--experimental-strip-types`)
- `packages/db` — TypeScript source + migration files
- `packages/client/dist` — built static assets

Migrations run on container start before the server process — the Dockerfile `CMD` is:

```sh
cd packages/db && node --experimental-strip-types src/migrator.ts \
  && cd /app && node --experimental-strip-types packages/server/src/index.ts
```

`packages/db/src/migrator.ts` runs `drizzle-kit migrate` programmatically before the server boots.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `4000`) |
| `DATABASE_URL` | Conditional | Postgres connection string (e.g. `postgresql://user:pass@host:5432/db`); when set, uses `postgres.js` driver |
| `PGLITE_DATA_DIR` | Conditional | Path to PGLite data directory; required when `DATABASE_URL` is not set |
| `NODE_ENV` | No | `production` / `development` |
| `DEMO_USER_ID` | No | Hard-coded demo user UUID for development; bypasses magic-link flow |

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

The server logs a warning at startup when `PGLITE_DATA_DIR` is set in `NODE_ENV=production`.

## Switching to Full Postgres

Set `DATABASE_URL` — the runtime automatically selects the `postgres.js` driver over PGLite. See `.env.example` and `docker-compose.yml`.

## PGLite (Local / Embedded)

Data is persisted to the volume at `/app/pgdata`. No separate database server is needed. Do not use in production — see idle CPU problem above.
