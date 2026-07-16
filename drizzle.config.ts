import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: 'db/src/schema.ts',
  out: 'db/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/autocal',
  },
});
