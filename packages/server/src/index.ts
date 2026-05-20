import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express4';
import { db } from '@auto-cal/db';
import { apiKeys } from '@auto-cal/db/schema';
import { seedDemoData, seedDemoUser } from '@auto-cal/db/seed';
import cors from 'cors';
import { eq } from 'drizzle-orm';
import express from 'express';
import { useServer } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import { hashApiKey, isApiKey } from './api-keys.ts';
import { verifyToken } from './auth.ts';
import { createLoaders } from './context.ts';
import type { Context } from './context.ts';
import { icalHandler } from './ical-route.ts';
import { schema } from './schema/index.ts';

async function buildContext(rawToken?: string, appBaseUrl?: string): Promise<Context> {
  const loaders = createLoaders(db);
  const baseUrl = appBaseUrl ?? process.env.APP_URL ?? 'http://localhost:3000';
  if (!rawToken) return { db, loaders, appBaseUrl: baseUrl };

  const payload = await verifyToken(rawToken);
  if (payload?.sub) return { db, userId: payload.sub, loaders, appBaseUrl: baseUrl };

  if (isApiKey(rawToken)) {
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
      db.update(apiKeys)
        .set({ lastUsedAt: now })
        .where(eq(apiKeys.id, key.id))
        .catch(console.error);
      return {
        db,
        userId: key.userId,
        apiKey: { id: key.id, scopes: key.scopes },
        loaders,
        appBaseUrl: baseUrl,
      };
    }
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    /^[0-9a-f-]{36}$/i.test(rawToken)
  )
    return { db, userId: rawToken, loaders, appBaseUrl: baseUrl };

  return { db, loaders, appBaseUrl: baseUrl };
}

const app = express();
const httpServer = http.createServer(app);

const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
const serverCleanup = useServer(
  {
    schema,
    context: (ctx) => {
      const raw = ctx.connectionParams?.authorization as string | undefined;
      return buildContext(raw);
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
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();
await seedDemoUser();
if (process.env.NODE_ENV !== 'production') {
  await seedDemoData();
}

const clientDist = path.resolve(process.cwd(), 'packages/client/dist');
const clientDistExists = fs.existsSync(clientDist);

if (clientDistExists) {
  app.use(express.static(clientDist));
}

app.use(
  '/graphql',
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }: { req: express.Request }): Promise<Context> => {
      const authHeader = req.headers.authorization;
      const rawToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;
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
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = Number(process.env.PORT ?? 3001);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ready at http://0.0.0.0:${PORT}/graphql`);
  if (clientDistExists) {
    console.log(`Serving client from ${clientDist}`);
  }
});
