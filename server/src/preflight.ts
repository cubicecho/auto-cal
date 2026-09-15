// Environment checks that must run before anything signs a token. Imported for
// its side effects as the very first import of index.ts, so a misconfigured
// instance fails with a sentence rather than quietly accepting forged tokens.

import { DEV_JWT_SECRET } from './auth.ts';

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEV_JWT_SECRET)
) {
  // Session tokens are signed with this and nothing else. A known secret means
  // anyone can mint a token for any account.
  console.error(
    'FATAL: JWT_SECRET must be set to a strong random value in production. Generate one with `openssl rand -hex 32`.',
  );
  process.exit(1);
}
