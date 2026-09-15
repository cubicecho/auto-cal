import type { DB } from '@auto-cal/db';
import { apiKeys } from '@auto-cal/db/schema';
import { eq } from 'drizzle-orm';
import { hashApiKey, isApiKey } from './api-keys.ts';
import { verifyToken } from './auth.ts';
import { createLoaders } from './context.ts';
import type { Context } from './context.ts';
import { authLog, log } from './logger.ts';

// Normalize an Authorization header / WS connectionParams value to a bare
// token. Accepts "Bearer <token>" (any case) or a bare token, so JWTs and API
// keys authenticate identically over HTTP and WebSocket. The WS path previously
// passed the raw "Bearer <token>" string straight through, which made every
// API-key (and JWT) subscription fail auth — clients like the Home Assistant
// integration then reconnected in a tight loop, burning idle CPU.
export function extractToken(
  authorization?: string | null,
): string | undefined {
  if (!authorization) return undefined;
  const trimmed = authorization.trim();
  if (!trimmed) return undefined;
  const bearer = /^Bearer\s+(.+)$/i.exec(trimmed);
  return bearer?.[1] ? bearer[1].trim() : trimmed;
}

/**
 * Resolve a request's credential to a context. Exactly two credentials
 * authenticate: a session JWT (from verifyMagicLink, or requestMagicLink when
 * AUTH_MAGIC_LINK=false) and an `acal_` API key. Anything else — a raw user
 * id included — yields an unauthenticated context.
 */
export async function buildContext(
  db: DB,
  rawToken?: string,
  appBaseUrl?: string,
): Promise<Context> {
  const loaders = createLoaders(db);
  const baseUrl = appBaseUrl ?? process.env.APP_URL ?? 'http://localhost:3000';
  if (!rawToken) {
    authLog.debug('No token — unauthenticated context');
    return { db, loaders, appBaseUrl: baseUrl };
  }

  const payload = await verifyToken(rawToken);
  if (payload?.sub) {
    authLog.debug('JWT verified for user', payload.sub);
    return { db, userId: payload.sub, loaders, appBaseUrl: baseUrl };
  }

  if (isApiKey(rawToken)) {
    authLog.debug('API key auth attempt');
    const hash = hashApiKey(rawToken);
    const now = new Date();
    const key = await db.query.apiKeys.findFirst({
      where: {
        keyHash: hash,
        revokedAt: { isNull: true },
      },
    });
    if (
      key &&
      (key.expiresAt === null ||
        key.expiresAt === undefined ||
        key.expiresAt > now)
    ) {
      authLog.debug('API key accepted for user', key.userId);
      db.update(apiKeys)
        .set({ lastUsedAt: now })
        .where(eq(apiKeys.id, key.id))
        .catch((err: unknown) =>
          log.error('Failed to update API key lastUsedAt:', err),
        );
      return {
        db,
        userId: key.userId,
        apiKey: { id: key.id, scopes: key.scopes },
        loaders,
        appBaseUrl: baseUrl,
      };
    }
    authLog.warn('API key rejected (not found or expired)');
  }

  authLog.debug('Token did not match any auth method — unauthenticated');
  return { db, loaders, appBaseUrl: baseUrl };
}
