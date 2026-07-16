# Auto Cal

**Auto Cal** is a smart todo and habit scheduling app that automatically fits your tasks into the time you have available.

🌐 **[Website & self-hosting guide](https://cubicecho.github.io/auto-cal/)** — what it does and how to run it yourself.

## What It Does

- **Intelligent scheduling** — tasks are placed into your calendar automatically based on priority and the time blocks you define
- **Activity-based time blocks** — define windows for specific activities (e.g. "5–7 pm for exercise") and tasks are matched to the right block
- **Habit tracking** — set recurring habits (e.g. 3× per week) and track your completion rate over time
- **Auto-rescheduling** — when a higher-priority item arrives, lower-priority items shift to make room

## Running with Docker

### Option 1: Embedded database (PGLite)

Simplest option. Data is stored in a Docker volume alongside the app — no separate database container needed.

```bash
docker compose -f docker-compose.pglite.yml up -d
```

Open http://localhost:3001.

To persist data across container recreations the named volume `auto-cal-data` is created automatically. Back it up with `docker volume` commands if needed.

### Option 2: PostgreSQL

Recommended for multi-user setups or when you want a standalone database you can back up independently.

```bash
docker compose -f docker-compose.postgres.yml up -d
```

Open http://localhost:3001.

> **Change the default password** before exposing this to a network. Edit `POSTGRES_PASSWORD` and the matching `DATABASE_URL` in `docker-compose.postgres.yml`.

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Set to `production` in containers | `development` |
| `PGLITE_DATA_DIR` | Path for embedded database files | — |
| `DATABASE_URL` | Postgres connection string (overrides PGLite) | — |
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
npm run db:migrate
npm run dev
```

This starts the GraphQL API at `http://localhost:3001` and the web client at `http://localhost:3000`.

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
| `npm run codegen` | Regenerate GraphQL types |
| `npm run build` | Production build |
| `npm run build:docker` | Build Docker image |

### Tech stack

**Frontend** — React, Expo Router, Apollo Client, ShadCN, Tailwind CSS, TypeScript

**Backend** — Node.js 22 (strip-types, no build step), Express, Apollo Server, Drizzle ORM, PGLite / PostgreSQL, Zod

**Tooling** — Biome (lint + format), Vitest, GraphQL Codegen, Drizzle Kit, Docker

### Contributing

- Run `npm run lint:fix` and `npm run typecheck` before committing — CI enforces both
- Server imports must include `.ts` extensions (no build step)
- See [AGENTS.md](./AGENTS.md) for architecture patterns and conventions

## License

MIT
