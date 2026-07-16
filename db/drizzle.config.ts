import { defineConfig } from 'drizzle-kit';

const url = process.env.PGLITE_DATA_DIR;
if (!url) throw new Error('PGLITE_DATA_DIR environment variable is required');

export default defineConfig({
  out: './drizzle',
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url },
});
