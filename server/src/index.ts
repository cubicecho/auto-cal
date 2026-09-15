// Must stay first: refuses to boot a misconfigured production instance.
import './preflight.ts';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApolloServer } from '@apollo/server';
import { unwrapResolverError } from '@apollo/server/errors';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import { db } from '@auto-cal/db';
import cors from 'cors';
import express from 'express';
import { useServer } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import { ZodError } from 'zod';
import { buildContext, extractToken } from './auth-context.ts';
import { magicLinkRequired } from './config.ts';
import type { Context } from './context.ts';
import { ErrorCode } from './errors.ts';
import { icalHandler } from './ical-route.ts';
import { log, logLevelName, wsLog } from './logger.ts';
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

if (!magicLinkRequired()) {
  log.warn(
    'AUTH_MAGIC_LINK=false — anyone who can reach this server can sign in as any email address. Secure local networks only.',
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
      return buildContext(db, raw);
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

      return buildContext(db, rawToken, appBaseUrl);
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
