# Auto Cal

**Auto Cal** is a smart todo and habit scheduling app that automatically fits your tasks into the time you have available.

🌐 **[Website & self-hosting guide](https://cubicecho.github.io/auto-cal/)** — what it does and how to run it yourself.

## What It Does

- **Intelligent scheduling** — tasks are placed into your calendar automatically based on priority and the time blocks you define
- **Activity-based time blocks** — define windows for specific activities (e.g. "5–7 pm for exercise") and tasks are matched to the right block
- **Habit tracking** — set recurring habits (e.g. 3× per week) and track your completion rate over time
- **Auto-rescheduling** — when a higher-priority item arrives, lower-priority items shift to make room

## Running with Docker

`docker-compose.yml` brings up the app and a PostgreSQL container together:

```bash
docker compose up -d
```

Open http://localhost:3001. Data lives in the named volume `postgres-data`, which you can back up with the usual `docker volume` / `pg_dump` tooling.

> **Change the default password** before exposing this to a network. Edit `POSTGRES_PASSWORD` and the matching `DATABASE_URL` in `docker-compose.yml`.

PostgreSQL is the only supported database — the app exits on startup without a `DATABASE_URL`.

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Set to `production` in containers | `development` |
| `DATABASE_URL` | Postgres connection string — **required** | — |
| `APP_URL` | Public URL of the app, used in magic-link emails | derived from request |
| `JWT_SECRET` | Secret for signing session tokens | auto-generated |
| `MAGIC_LINK_SECRET` | Secret for signing magic-link tokens | auto-generated |

---

## Development

### Prerequisites

- **Node.js 22+**
- **npm**

### Setup

```bash
npm install
cp .env.example .env
npm run db:up      # start a local Postgres in Docker (host port 5434)
npm run dev
```

This starts the GraphQL API at `http://localhost:3001` and the web client at `http://localhost:3000`. Migrations are applied automatically when the server boots; `npm run db:down` stops the database.

Tests need no database of their own — they run against an in-memory instance.

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start API + client in watch mode |
| `npm run dev:server` | API only |
| `npm run dev:client` | Client only |
| `npm test` | Run test suite |
| `npm run lint` | Check for lint issues |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run typecheck` | TypeScript check across all packages |
| `npm run db:generate` | Generate a migration after schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:up` | Start the local Postgres container |
| `npm run db:down` | Stop the local Postgres container |
| `npm run codegen` | Regenerate GraphQL types |
| `npm run build` | Production build |
| `npm run build:docker` | Build Docker image |

### Tech stack

**Frontend** — React, Expo Router, Apollo Client, ShadCN, Tailwind CSS, TypeScript

**Backend** — Node.js 22 (strip-types, no build step), Express, Apollo Server, Drizzle ORM, PostgreSQL, Zod

**Tooling** — Biome (lint + format), Vitest, GraphQL Codegen, Drizzle Kit, Docker

### Contributing

- Run `npm run lint:fix` and `npm run typecheck` before committing — CI enforces both
- Server imports must include `.ts` extensions (no build step)
- See [AGENTS.md](./AGENTS.md) for architecture patterns and conventions

## License

MIT
