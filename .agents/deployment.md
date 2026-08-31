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

The separate `db/src/migrator.ts` script is redundant in Docker — the server migrates on boot — but it is safe to run. It used to hang forever (postgres.js holds the event loop open until the pool is closed, so the script printed `Migrations complete` and never exited, which would have stalled an `&&`-chained CMD before the server started); it now calls `closeDb()` and exits.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `3001`) |
| `DATABASE_URL` | **Yes** | Postgres connection string (e.g. `postgresql://user:pass@host:5432/db`). The server throws on boot without it — there is no fallback backend |
| `DATABASE_POOL_MAX` | No | Connections in the postgres.js pool (default `10`). See [Connection Pooling](#connection-pooling) |
| `DATABASE_IDLE_TIMEOUT` | No | Seconds an idle connection is kept before being retired (default `30`) |
| `DATABASE_CONNECT_TIMEOUT` | No | Seconds to wait for a connection before failing (default `10`) |
| `NODE_ENV` | No | `production` / `development` |
| `EXPOSE_MAGIC_LINK` | No | `1`/`true`/`yes` returns the magic link directly in the `requestMagicLink` response (dev-style passwordless login) even in production. For local/secure networks only — never enable on a public deployment. |
| `BYPASS_AUTH_UUID` | No | An existing user UUID accepted as a Bearer token in any environment; passwordless access for that one user. Local/secure networks only. |
| `VAPID_PUBLIC_KEY` | No | Web Push application server key, base64url. The client fetches it via `myPushPublicKey`. |
| `VAPID_PRIVATE_KEY` | No | Its private half. Never leaves the server. |
| `VAPID_SUBJECT` | No | Contact URL the push services require, e.g. `mailto:admin@example.com`. |
| `NOTIFICATION_TICK_SECONDS` | No | How often the notification tick runs (default `60`). Also the width of the window each pass covers. |

### Push Notifications

All three `VAPID_*` variables must be set together. With any of them missing the
server boots normally, logs `[notifications] VAPID keys not set`, starts no tick,
and `myPushPublicKey` returns null — which is how the client knows to hide the
notification card rather than offering a button that cannot work.

Generate a key pair once and keep it: rotating it invalidates every registered
browser subscription, which silently stops delivery until each user re-enables
notifications.

```bash
npx web-push generate-vapid-keys
```

The tick is a `setInterval` inside the API process, not a separate worker. It is
`unref`ed, so it never holds the process open, and it is idempotent through the
unique constraint on `sent_notifications` — but that idempotency is per-database,
not per-process. **Running more than one replica means each replica ticks**;
overlapping ticks will not double-send (the loser of the insert sends nothing),
so this is safe, merely redundant.


## Connection Pooling

`db/src/index.ts` builds one postgres.js pool for the process and exports the
Drizzle instance over it. The sizing is stated explicitly rather than inherited:

```ts
postgres(databaseUrl, {
  max: intEnv('DATABASE_POOL_MAX', 10),
  idle_timeout: intEnv('DATABASE_IDLE_TIMEOUT', 30),
  connect_timeout: intEnv('DATABASE_CONNECT_TIMEOUT', 10),
})
```

**`max: 10` — postgres.js's own default, kept.** The load that motivated the
question is `runSchedulerWriteback`, which every mutating resolver fires and
forgets, so several full recomputes for one user can be in flight at once. That
turns out not to need a bigger pool: postgres.js *queues* work beyond `max`
rather than erroring, and 12- and 50-way concurrent writebacks for a single user
complete with zero failures and a consistent final schedule on a 10-connection
pool. Raising `max` would let more of them run at once; it would not make them
correct, because they already are.

**It is tunable because the right number is not a constant.** A Postgres server
has a global `max_connections` (100 by default, minus superuser reservations),
and every replica holds its own pool. The budget is roughly
`max_connections / replicas`, so scaling out is the reason to turn `max` *down*,
not up. Ten replicas on a default Postgres is already at the ceiling.

**`idle_timeout: 30` is a change from the postgres.js default of `0`** (keep idle
connections forever). Server-side slots are the scarce resource, and an instance
that has gone quiet — or that is being scaled down — should stop holding them.
`connect_timeout: 10` exists so a boot that cannot reach the database fails
instead of hanging.

**pgBouncer is not needed at this size and would cost something.** A single API
process with a bounded pool already is the connection multiplexer that pgBouncer
would provide. It becomes worth adding at the point where replica count times
`DATABASE_POOL_MAX` approaches `max_connections`; note that transaction-mode
pooling breaks session state, so it would need `prepare: false` on the
postgres.js side.

**Notices are filtered, not printed raw.** postgres.js's default `onnotice`
dumps the whole notice object to stdout, so every boot logged a multi-line
`{severity: 'NOTICE', code: '42P06', ...}` for drizzle's own
`CREATE SCHEMA IF NOT EXISTS drizzle`. `onnotice` now drops the duplicate-object
codes (`42P06`, `42P07`) the migrator provokes on every run after the first and
prints anything else as a single `[auto-cal] postgres notice ...` line.

## Verified Against Real Postgres

The production path was exercised end to end against a clean Postgres 16
container (cubicecho/auto-cal#49) — worth recording because everything else
(tests, CI) runs on PGLite, and the concern was that PGLite had been hiding a
divergence.

- **Migrations from a virgin database.** The full set applies cleanly and
  idempotently, producing 14 tables. A second run is a no-op.
- **`time_blocks.days_of_week`.** Genuinely `integer[]` on Postgres; values
  round-trip exactly.
- **Timestamps.** Every timestamp column is `timestamp without time zone`, which
  was the suspected divergence. It is not one: instants written and read back
  through postgres.js are identical under `TZ=UTC`, `America/Chicago` and
  `Asia/Tokyo` (zero drift). The scheduler does its own timezone arithmetic with
  `date-fns-tz` and never relies on the server's `TimeZone` setting.
- **Concurrency.** 12 and 50 overlapping `runSchedulerWriteback` calls for one
  user: no failures, consistent final schedule. See
  [Connection Pooling](#connection-pooling).
- **Running app.** Auth, generated and hand-written queries, mutations,
  `mySchedule`, the `scheduledAt` column proving the fire-and-forget writeback
  landed, `myCreateApiKey`, the `/ical?secret=` route (200, `text/calendar`,
  real `VEVENT`s), and a `myTodosUpdated` subscription delivered over the
  WebSocket transport.

No PGLite-specific surprises. Two real defects surfaced and were fixed: the
migrator never exiting, and the raw notice object on every boot.

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
