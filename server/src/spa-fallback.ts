import path from 'node:path';
import type { Request, RequestHandler, Response } from 'express';

/**
 * Path pattern for the single-page-app fallback.
 *
 * Express 5 routes through path-to-regexp v8, where a wildcard has to be a
 * *named* parameter. The Express 4 form, a bare `*`, is not merely different —
 * it throws `Missing parameter name at index 1` when the route is registered,
 * so that half of the upgrade fails the boot rather than the deep links.
 *
 * `{*splat}` is the optional form and matches `/` as well as any deeper path.
 * `/*splat` — one-or-more segments — would also work here, because
 * `express.static` answers `/` with `index.html` before the fallback is
 * reached, but only for as long as that stays true. The optional form does not
 * depend on it.
 *
 * Exported (with {@link spaFallback}) because `index.ts` starts a server at
 * import time and so cannot be imported by a test. See
 * `server/test/spa-fallback.test.ts`.
 */
export const SPA_FALLBACK_ROUTE = '/{*splat}';

/** Serves the built `index.html` for any path the static handler did not claim. */
export function spaFallback(clientDist: string): RequestHandler {
  const indexHtml = path.join(clientDist, 'index.html');
  return (_req: Request, res: Response) => {
    res.sendFile(indexHtml);
  };
}
