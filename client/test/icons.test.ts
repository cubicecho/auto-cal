import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * `icons.tsx` and `icons.web.tsx` are a Metro platform pair, and TypeScript
 * only ever resolves the native one — a name added to one file and forgotten
 * in the other compiles cleanly and throws at runtime on the platform that is
 * missing it. This is the only thing checking they stay in step.
 *
 * Parsed as text rather than imported: the native module pulls in
 * react-native-svg and nativewind, neither of which runs under a node
 * environment.
 */
const CLIENT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UI = join(CLIENT, 'src/components/ui');

function read(file: string) {
  return readFileSync(join(UI, file), 'utf8');
}

function namesMatching(source: string, pattern: RegExp) {
  return [...source.matchAll(pattern)].map((m) => m[1] as string).sort();
}

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__generated__' && entry.name !== 'node_modules') {
        yield* sourceFiles(path);
      }
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      yield path;
    }
  }
}

describe('icons', () => {
  const native = read('icons.tsx');
  const web = read('icons.web.tsx');

  const nativeNames = namesMatching(native, /^export const (\w+) = icon\(/gm);
  const webNames = namesMatching(
    web.slice(web.indexOf('export {'), web.indexOf('} from')),
    /^\s*(\w+),$/gm,
  );

  it('exports the same names from both platforms', () => {
    expect(nativeNames.length).toBeGreaterThan(0);
    expect(webNames).toEqual(nativeNames);
  });

  it('imports each native icon directly, never through the barrel', () => {
    // The barrel re-exports ~1600 modules and Metro does not tree-shake, so
    // one *value* import of it would pull the whole set into the native
    // bundle. `import type` is erased before Metro sees it and is fine.
    expect(native).not.toMatch(
      /^import (?!type )[^;]*from 'lucide-react-native';$/m,
    );

    const imported = namesMatching(
      native,
      /^import (\w+)Source from 'lucide-react-native\/icons\/[a-z0-9-]+';$/gm,
    );
    expect(imported).toEqual(nativeNames);
  });

  it('is the only route to lucide', () => {
    const offenders: string[] = [];
    for (const dir of ['app', 'src']) {
      for (const file of sourceFiles(join(CLIENT, dir))) {
        if (file.startsWith(join(UI, 'icons'))) continue;
        if (/from 'lucide-react/.test(readFileSync(file, 'utf8'))) {
          offenders.push(relative(CLIENT, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
