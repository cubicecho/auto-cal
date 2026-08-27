import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Metro picks `X.web.tsx` on web and `X.native.tsx` on iOS/Android, falling
 * back to `X.tsx`. TypeScript does no such thing — it resolves the plain
 * `X.tsx` and never looks at the platform sibling, so a name added to one file
 * and forgotten in the other compiles clean and throws at runtime on whichever
 * platform is missing it.
 *
 * This is the only check on that. It compares exported *names* only; the
 * shapes behind them are the `-base.ts` module's job.
 */
const CLIENT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__generated__' && entry.name !== 'node_modules') {
        yield* sourceFiles(path);
      }
    } else if (entry.name.endsWith('.tsx')) {
      yield path;
    }
  }
}

/** Every `X.tsx` that has a `X.web.tsx` or `X.native.tsx` beside it. */
function platformPairs() {
  const pairs: Array<{ plain: string; variant: string }> = [];
  for (const dir of ['app', 'src']) {
    for (const variant of sourceFiles(join(CLIENT, dir))) {
      const plain = variant.replace(/\.(web|native)\.tsx$/, '.tsx');
      if (plain !== variant && existsSync(plain))
        pairs.push({ plain, variant });
    }
  }
  return pairs;
}

function exportedNames(file: string) {
  const source = readFileSync(file, 'utf8');
  const names = new Set<string>();

  // Route screens default-export their component, and the web and native
  // halves of a route are genuinely different components — all that has to
  // match there is that both export a default at all.
  if (/^export default\b/m.test(source)) names.add('default');

  for (const [, name] of source.matchAll(
    /^export (?:async )?function (\w+)/gm,
  )) {
    if (name) names.add(name);
  }
  for (const [, name] of source.matchAll(
    /^export (?:const|let|var|type|interface) (\w+)/gm,
  )) {
    if (name) names.add(name);
  }
  // `export { A, B as C };` and `export type { … } from '…';`, both of which
  // wrap across lines. The exported name is what follows `as` when present.
  for (const [, body] of source.matchAll(/^export (?:type )?\{([^}]*)\}/gms)) {
    for (const clause of (body ?? '').split(',')) {
      const name = clause
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) names.add(name);
    }
  }
  return [...names].sort();
}

describe('platform pairs', () => {
  const pairs = platformPairs();

  it('finds the pairs to check', () => {
    // A rename that breaks the discovery above would otherwise turn this whole
    // suite into a silent no-op.
    expect(pairs.length).toBeGreaterThanOrEqual(5);
  });

  for (const { plain, variant } of pairs) {
    it(`${relative(CLIENT, variant)} exports what ${relative(CLIENT, plain)} does`, () => {
      const expected = exportedNames(plain);
      expect(expected.length).toBeGreaterThan(0);
      expect(exportedNames(variant)).toEqual(expected);
    });
  }
});
