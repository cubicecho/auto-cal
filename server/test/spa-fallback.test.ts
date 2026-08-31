import { mkdtempSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SPA_FALLBACK_ROUTE, spaFallback } from '../src/spa-fallback.ts';

// `index.ts` starts a server at import time, so the route it registers cannot be
// exercised from a test directly — hence spa-fallback.ts. What is worth pinning
// is the path pattern: Express 5 dropped the bare `*` wildcard, and a fallback
// that matches too little breaks every deep link while leaving `/graphql`,
// `/ical` and the static assets working, so nothing else would fail.
//
// The app is assembled here in the same order as index.ts — static, then the
// real routes, then the catch-all — because the ordering is half of what is
// being asserted.

const INDEX_HTML = '<!DOCTYPE html><html><body>app shell</body></html>';
const ASSET_JS = 'console.log("asset")';

let server: Server;
let origin: string;

beforeAll(async () => {
  const dist = mkdtempSync(path.join(tmpdir(), 'auto-cal-dist-'));
  writeFileSync(path.join(dist, 'index.html'), INDEX_HTML);
  writeFileSync(path.join(dist, 'asset.js'), ASSET_JS);

  // The same order as index.ts: static first, then the catch-all.
  const app = express();
  app.use(express.static(dist));
  app.get('/ical', (_req, res) => {
    res.send('CALENDAR');
  });
  app.get(SPA_FALLBACK_ROUTE, spaFallback(dist));

  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const address = server.address();
  if (typeof address === 'string' || address === null) {
    throw new Error('expected a TCP address');
  }
  origin = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('SPA fallback route', () => {
  // Answered by express.static rather than the fallback, which is exactly why
  // the fallback uses the optional `{*splat}` and not `/*splat`: the behaviour
  // holds either way today, and only one of them keeps holding if static stops
  // serving an index.
  it('serves the app shell at the site root', async () => {
    const response = await fetch(`${origin}/`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('app shell');
  });

  it.each([
    ['/todos', 'a one-segment route'],
    ['/projects/abc-123', 'a two-segment route'],
    ['/a/b/c/d/e', 'an arbitrarily deep route'],
  ])('serves the app shell at %s (%s)', async (route) => {
    const response = await fetch(`${origin}${route}`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('app shell');
  });

  it('does not shadow a real static asset', async () => {
    const response = await fetch(`${origin}/asset.js`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(ASSET_JS);
  });

  it('does not shadow a route registered before it', async () => {
    const response = await fetch(`${origin}/ical`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('CALENDAR');
  });

  it('leaves non-GET methods alone', async () => {
    const response = await fetch(`${origin}/todos`, { method: 'POST' });
    expect(response.status).toBe(404);
  });
});
