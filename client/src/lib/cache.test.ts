/**
 * Drift check between the client's invalidation targets and the server SDL.
 *
 * `ROOT_FIELDS` is the one place in the client that names schema fields as
 * strings, so it is the one place that can silently rot when a resolver is
 * renamed. CI runs `npm run codegen` before `npm test`, so the generated SDL
 * is always present here.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSchema } from 'graphql';
import { describe, expect, it } from 'vitest';
import { DERIVED, ROOT_FIELDS } from './cache';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sdlPath = resolve(
  __dirname,
  '../../../server/src/__generated__/schema.graphql',
);

const queryFields = Object.keys(
  buildSchema(readFileSync(sdlPath, 'utf8')).getQueryType()?.getFields() ?? {},
);

describe('ROOT_FIELDS', () => {
  it('names only fields that exist on Query', () => {
    const missing = ROOT_FIELDS.filter((f) => !queryFields.includes(f));
    expect(missing).toEqual([]);
  });

  it('covers every field on Query', () => {
    // Not strictly required — a field nothing invalidates is harmless — but an
    // uncovered field is nearly always a new query someone forgot to wire in.
    const uncovered = queryFields.filter(
      (f) => !(ROOT_FIELDS as readonly string[]).includes(f),
    );
    expect(uncovered).toEqual([]);
  });
});

describe('DERIVED', () => {
  it('is a subset of ROOT_FIELDS', () => {
    const stray = DERIVED.filter(
      (f) => !(ROOT_FIELDS as readonly string[]).includes(f),
    );
    expect(stray).toEqual([]);
  });
});
