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
    include: ['packages/*/test/**/*.test.ts', 'packages/*/src/**/*.test.ts'],
    // Prevent .env's PGLITE_DATA_DIR from leaking into tests.
    // Any test that accidentally imports @auto-cal/db without mocking it will
    // throw immediately ("Set DATABASE_URL or PGLITE_DATA_DIR") rather than
    // silently opening a file-backed database.
    env: {
      DATABASE_URL: '',
      PGLITE_DATA_DIR: '',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['packages/*/src/**/*.ts'],
      exclude: [
        'packages/*/test/**',
        'packages/*/src/**/*.test.ts',
        'packages/*/src/__generated__/**',
      ],
    },
  },
});
