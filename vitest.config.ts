import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Ensure only one graphql instance is loaded across all packages.
    // Without this alias vitest's ESM module graph can end up with two copies
    // (e.g. drizzle-graphql + server code), causing instanceof checks to fail.
    alias: {
      graphql: resolve('./node_modules/graphql/index.js'),
      'react-native': resolve('./node_modules/react-native-web'),
      '@': resolve('./client/src'),
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.tsx',
      '.ts',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      '{client,db,server}/test/**/*.test.{ts,tsx}',
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

      // Thresholds on the two places where a regression is both likely and
      // silent: the scheduler, which is pure logic nobody sees fail until a
      // day looks wrong, and the resolver layer, which is where every
      // ownership guard lives. Everything else — screens, UI primitives, the
      // server bootstrap — is deliberately left unthresholded rather than
      // padded up to a number.
      //
      // Each entry is set a little below what the suite currently reaches, so
      // it catches a real loss of coverage instead of failing the first time
      // someone adds a branch. Raise them when the actual number moves up.
      thresholds: {
        'server/src/services/scheduler.ts': {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 90,
        },
        'server/src/schema/resolvers/**': {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 85,
        },
      },
    },
  },
});
