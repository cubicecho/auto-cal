import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApolloServer } from '@apollo/server';
import { unwrapResolverError } from '@apollo/server/errors';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import { db } from '@auto-cal/db';
import { apiKeys } from '@auto-cal/db/schema';
import cors from 'cors';
import { eq } from 'drizzle-orm';
import express from 'express';
import { useServer } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import { ZodError } from 'zod';
import { hashApiKey, isApiKey } from './api-keys.ts';
import { verifyToken } from './auth.ts';
import { createLoaders } from './context.ts';
import type { Context } from './context.ts';
import { ErrorCode } from './errors.ts';
import { icalHandler } from './ical-route.ts';
import { authLog, log, logLevelName, wsLog } from './logger.ts';
import { schema } from './schema/index.ts';
import { startNotificationTick } from './services/notifications.ts';
import { SPA_FALLBACK_ROUTE, spaFallback } from './spa-fallback.ts';

// Read version from server/package.json (../ from src/). Works under
// `node src/index.ts` in Docker where npm_package_version is unset.
const { version: appVersion } = JSON.parse(
  fs.readFileSync(
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../package.json',
    ),
    'utf8',
  ),
) as { version: string };

process.on('uncaughtException', (err) => {
  log.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

// Normalize an Authorization header / WS connectionParams value to a bare
// token. Accepts "Bearer <token>" (any case) or a bare token, so JWTs and API
// keys authenticate identically over HTTP and WebSocket. The WS path previously
// passed the raw "Bearer <token>" string straight through, which made every
// API-key (and JWT) subscription fail auth — clients like the Home Assistant
// integration then reconnected in a tight loop, burning idle CPU.
function extractToken(authorization?: string | null): string | undefined {
  if (!authorization) return undefined;
  const trimmed = authorization.trim();
  if (!trimmed) return undefined;
  const bearer = /^Bearer\s+(.+)$/i.exec(trimmed);
  return bearer?.[1] ? bearer[1].trim() : trimmed;
}

async function buildContext(
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

  // Env-var bypass: accept one specific UUID in any environment.
  // Set BYPASS_AUTH_UUID to an existing user ID to allow passwordless access.
  const bypassUuid = process.env.BYPASS_AUTH_UUID;
  if (bypassUuid && rawToken === bypassUuid) {
    authLog.debug('BYPASS_AUTH_UUID auth for', rawToken);
    return { db, userId: rawToken, loaders, appBaseUrl: baseUrl };
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    /^[0-9a-f-]{36}$/i.test(rawToken)
  ) {
    authLog.debug('UUID fallback auth (dev only) for', rawToken);
    return { db, userId: rawToken, loaders, appBaseUrl: baseUrl };
  }

  authLog.debug('Token did not match any auth method — unauthenticated');
  return { db, loaders, appBaseUrl: baseUrl };
}

if (process.env.BYPASS_AUTH_UUID) {
  log.warn(
    'BYPASS_AUTH_UUID is set — magic-link auth bypassed for user',
    process.env.BYPASS_AUTH_UUID,
  );
}

log.info('Building GraphQL schema...');
const app = express();
const httpServer = http.createServer(app);

log.info('Starting WebSocket server...');
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

wsServer.on('connection', (_, req) => {
  wsLog.debug('WebSocket connection from', req.socket.remoteAddress);
});
wsServer.on('error', (err) => {
  wsLog.error('WebSocket server error:', err);
});

const serverCleanup = useServer(
  {
    schema,
    context: (ctx) => {
      const raw = extractToken(
        ctx.connectionParams?.authorization as string | undefined,
      );
      return buildContext(raw);
    },
    onConnect: (ctx) => {
      wsLog.debug(
        'GraphQL WS connect',
        ctx.connectionParams ? '(with auth)' : '(no auth)',
      );
    },
    onDisconnect: () => {
      wsLog.debug('GraphQL WS disconnect');
    },
    onError: (_ctx, _msg, errors) => {
      wsLog.error('GraphQL WS error:', errors);
    },
  },
  wsServer,
);

const server = new ApolloServer<Context>({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        log.info('Apollo Server starting...');
        return {
          async drainServer() {
            log.info('Draining server...');
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
  formatError(formattedError, error) {
    log.error('GraphQL error:', formattedError.message, error);

    // Zod throws from the resolver boundary, so without this its failures reach
    // the client as INTERNAL_SERVER_ERROR with a raw stringified issue list.
    const original = unwrapResolverError(error);
    if (original instanceof ZodError) {
      return {
        ...formattedError,
        message: 'Invalid input',
        extensions: {
          code: ErrorCode.BadUserInput,
          issues: original.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
      };
    }

    // Anything still uncoded is unexpected — a thrown bare Error, a driver
    // failure. Those messages can carry SQL and internal paths, so in
    // production they are replaced rather than forwarded. Coded errors are
    // deliberate and pass through untouched.
    if (
      process.env.NODE_ENV === 'production' &&
      formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR'
    ) {
      return {
        ...formattedError,
        message: 'Internal server error',
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      };
    }

    return formattedError;
  },
});

log.info('Starting Apollo Server...');
await server.start();
log.info('Apollo Server started');

const clientDist = path.resolve(process.cwd(), 'client/dist');
const clientDistExists = fs.existsSync(clientDist);

if (clientDistExists) {
  log.info('Serving static client from', clientDist);
  app.use(express.static(clientDist));
} else {
  log.info('No client dist found at', clientDist, '— skipping static serving');
}

app.use(
  '/graphql',
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }: { req: express.Request }): Promise<Context> => {
      const rawToken = extractToken(req.headers.authorization);
      const appBaseUrl =
        process.env.NODE_ENV === 'production'
          ? (process.env.APP_URL ?? `${req.protocol}://${req.get('host')}`)
          : (req.get('origin') ?? `${req.protocol}://${req.get('host')}`);

      return buildContext(rawToken, appBaseUrl);
    },
  }),
);

app.get('/ical', icalHandler);

if (clientDistExists) {
  app.get(SPA_FALLBACK_ROUTE, spaFallback(clientDist));
}

const PORT = Number(process.env.PORT ?? 3001);

httpServer.listen(PORT, '0.0.0.0', () => {
  log.info(
    `auto-cal server v${appVersion} | node ${process.version} | ` +
      `env=${process.env.NODE_ENV ?? 'development'} | db=postgres | ` +
      `log=${logLevelName} | port=${PORT} | pid=${process.pid}`,
  );
  log.info(`Server ready at http://0.0.0.0:${PORT}/graphql`);
  // No-op (and says so) unless the VAPID keys are set, so a deploy without
  // them boots normally and simply never notifies.
  startNotificationTick(db);
  if (clientDistExists) {
    log.info('Client served from', clientDist);
  }
});
