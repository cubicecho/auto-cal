import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const PREFIX = 'acal_';

/** Generate a new API key token, its SHA-256 hash, and its display prefix. */
export function generateApiKey(): {
  token: string;
  hash: string;
  prefix: string;
} {
  const raw = randomBytes(32).toString('base64url');
  const token = `${PREFIX}${raw}`;
  const hash = hashApiKey(token);
  const prefix = raw.slice(0, 8);
  return { token, hash, prefix };
}

/** Returns true if the raw token looks like an API key (starts with `acal_`). */
export function isApiKey(raw: string): boolean {
  return raw.startsWith(PREFIX);
}

/** SHA-256 hex hash of a raw API key token. */
export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Timing-safe equality check for two strings. Returns false if lengths differ. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return timingSafeEqual(bufA, bufB);
}
