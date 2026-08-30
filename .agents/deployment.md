# Deployment

## Docker

Single-stage image — build must run **outside** Docker before `docker build`:

```bash
npm run build       # codegen + expo export --platform web + server tsc
docker build -t auto-cal .
```

The Dockerfile installs only production deps, then copies:
- `server` — TypeScript source (run with `--experimental-strip-types`)
- `db` — TypeScript source + migration files
- `client/dist` — built static assets

Migrations run automatically when the server starts — `db/src/index.ts` calls `migrate()` before exporting `db`. The Dockerfile `CMD` is:

```sh
node --experimental-strip-types server/src/index.ts
```

**Do not use the separate `src/migrator.ts` script in Docker.** postgres.js keeps its connection pool open after `migrate()` returns, so the migrator process never exits. The `&&`-chained CMD would hang forever before the server starts. `db/src/index.ts` already runs migrations on boot.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `3001`) |
| `DATABASE_URL` | **Yes** | Postgres connection string (e.g. `postgresql://user:pass@host:5432/db`). The server throws on boot without it — there is no fallback backend |
| `NODE_ENV` | No | `production` / `development` |
| `EXPOSE_MAGIC_LINK` | No | `1`/`true`/`yes` returns the magic link directly in the `requestMagicLink` response (dev-style passwordless login) even in production. For local/secure networks only — never enable on a public deployment. |
| `BYPASS_AUTH_UUID` | No | An existing user UUID accepted as a Bearer token in any environment; passwordless access for that one user. Local/secure networks only. |

## Docker Compose Files

| File | Contents | Use case |
|------|----------|----------|
| `docker-compose.yml` | App + Postgres | Deployment, and any full-stack run |
| `docker-compose.dev.yml` | Postgres only | Local dev — the app runs on the host via `npm run dev` (`npm run db:up` / `npm run db:down`) |

There is no embedded-database compose file. `docker-compose.pglite.yml` and the
redundant `docker-compose.postgres.yml` were removed when PGLite stopped being a
runtime backend.

## Why PGLite Is Not a Runtime Backend

PGLite compiles PostgreSQL to WebAssembly via Emscripten. Emscripten simulates
PostgreSQL's event loop with `setTimeout(fn, 0)` — a busy-wait that fires on
every event loop tick. Real Postgres uses OS-level sleep between background
worker wakeups; the WASM port cannot, so the Node.js process consumes measurable
CPU even with zero client activity.

**Root cause:** `postgres.js` in `@electric-sql/pglite` contains
`setTimeout(MainLoop.runner, 0)` — Emscripten's unconditional main-loop spin.

The deeper problem was that PGLite was the *fallback*: an app container that
never received `DATABASE_URL` silently opened an embedded database and burned
idle CPU while the Postgres container sat unused, and the only symptom was a
startup log line. `db/src/index.ts` now throws without `DATABASE_URL`, so that
failure mode is loud and immediate.

PGLite remains a **test** dependency — `server/test/**` builds in-memory
instances directly (`new PGlite('memory://')`, see
`server/test/schema/resolvers/test-helpers.ts`), which is why `npm test` needs
no database. It is a devDependency of `server`, so `npm install --omit=dev`
never installs it.

## Historical PGLite Notes

Kept because the symptoms are recognisable and the reasoning still explains the
current shape:

**Silent-fallback footgun (twice fixed).** The Dockerfile once baked in
`ENV PGLITE_DATA_DIR=/app/pgdata`, so running the image without `DATABASE_URL`
quietly dropped to PGLite. Removing that default only downgraded the failure to
"fails unless someone sets the other variable"; removing the backend removed the
class of bug.

**Startup log.** The server prints `[auto-cal] DB backend: Postgres (via
DATABASE_URL)` on boot. There is now only one thing it can print, but the line
is worth keeping: its absence means the process died before the database was
reached.

## Local Development

```bash
npm run db:up     # docker compose -f docker-compose.dev.yml up -d
# .env: DATABASE_URL=postgresql://autocal:autocal@127.0.0.1:5434/autocal
npm run dev
npm run db:down   # when finished
```

The dev database binds `127.0.0.1:5434`, not the default 5432, because a
developer machine usually already has something on 5432. Set `AUTOCAL_DB_PORT`
to move it.

Migrations run on server boot, so `npm run db:migrate` is only needed to apply
migrations without starting the server.
