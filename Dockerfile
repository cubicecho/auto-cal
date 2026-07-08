# ── Stage 1: bundle the Expo web client ──────────────────────────────────────
FROM node:22-alpine AS client-builder

WORKDIR /app

# Copy workspace manifests so npm install can resolve all workspaces
COPY package*.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/db/package*.json ./packages/db/
COPY packages/server/package*.json ./packages/server/

RUN npm install --legacy-peer-deps

# Copy client source (includes committed src/__generated__/ types)
COPY packages/client ./packages/client

# Export the web bundle; no EXPO_PUBLIC_API_URL → defaults to '' → relative /graphql
RUN cd packages/client && npx expo export --platform web

# ── Stage 2: production server ────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
COPY packages/db/package*.json ./packages/db/

RUN npm install --omit=dev

COPY packages/server ./packages/server
COPY packages/db ./packages/db

# Pull the built web bundle from Stage 1
COPY --from=client-builder /app/packages/client/dist ./packages/client/dist

RUN mkdir -p /app/pgdata

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000
# NOTE: PGLITE_DATA_DIR is intentionally NOT baked in. The backend is chosen at
# runtime: DATABASE_URL → real Postgres; otherwise PGLITE_DATA_DIR → PGLite.
# Baking in a PGLITE_DATA_DIR default made a run without DATABASE_URL silently
# fall back to PGLite's WASM event loop, which busy-waits and burns CPU at idle.
# Now such a run fails loudly ("Set DATABASE_URL or PGLITE_DATA_DIR") instead.
# For the embedded-DB mode, docker-compose.pglite.yml sets PGLITE_DATA_DIR itself.

CMD ["node", "--experimental-strip-types", "packages/server/src/index.ts"]
