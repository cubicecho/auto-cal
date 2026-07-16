import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CodegenConfig } from '@graphql-codegen/cli';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: CodegenConfig = {
  schema: path.resolve(__dirname, 'server/src/__generated__/schema.graphql'),
  documents: [
    path.resolve(__dirname, 'client/src/**/*.{tsx,ts}'),
    path.resolve(__dirname, 'client/app/**/*.{tsx,ts}'),
    // Exclude generated output
    `!${path.resolve(__dirname, 'client/src/__generated__/**')}`,
  ],
  ignoreNoDocuments: true,
  generates: {
    [`${path.resolve(__dirname, 'client/src/__generated__')}/`]: {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      //       config: { documentMode: 'string' },
    },
  },
};

export default config;
