import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Ensure only one graphql instance is loaded across all packages.
    // Without this alias vitest's ESM module graph can end up with two copies
    // (e.g. drizzle-graphql + server code), causing instanceof checks to fail.
    alias: {
      graphql: resolve('./node_modules/graphql/index.js'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      '{client,db,server}/test/**/*.test.ts',
      '{client,db,server}/src/**/*.test.ts',
    ],
    // Prevent .env's DATABASE_URL from leaking into tests. Any test that
    // accidentally imports @auto-cal/db without mocking it throws immediately
    // ("DATABASE_URL is required") rather than connecting to — and migrating —
    // a real database. Tests build their own in-memory PGLite instead; see
    // server/test/schema/resolvers/test-helpers.ts.
    env: {
      DATABASE_URL: '',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['{client,db,server}/src/**/*.ts'],
      exclude: [
        '{client,db,server}/test/**',
        '{client,db,server}/src/**/*.test.ts',
        '{client,db,server}/src/__generated__/**',
      ],
    },
  },
});
