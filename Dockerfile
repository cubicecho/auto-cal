# ── Stage 1: bundle the Expo web client ──────────────────────────────────────
FROM node:22-alpine AS client-builder

WORKDIR /app

# Copy workspace manifests so npm install can resolve all workspaces
COPY package*.json ./
COPY client/package*.json ./client/
COPY db/package*.json ./db/
COPY server/package*.json ./server/

RUN npm install --legacy-peer-deps

# Copy sources + codegen configs. __generated__/ types are gitignored, so they
# are NOT in the build context — they must be generated here. Codegen builds the
# GraphQL schema from the db + server Drizzle definitions, so all three packages
# and the root codegen configs are required.
COPY db ./db
COPY server ./server
COPY client ./client
COPY codegen.ts codegen.server.ts ./

# Generate schema.graphql + typed client operations, then export the web bundle.
# (no EXPO_PUBLIC_API_URL → defaults to '' → relative /graphql)
RUN npm run codegen
RUN cd client && npx expo export --platform web

# ── Stage 2: production server ────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY db/package*.json ./db/

RUN npm install --omit=dev

COPY server ./server
COPY db ./db

# Pull the built web bundle from Stage 1
COPY --from=client-builder /app/client/dist ./client/dist

RUN mkdir -p /app/pgdata

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
# NOTE: PGLITE_DATA_DIR is intentionally NOT baked in. The backend is chosen at
# runtime: DATABASE_URL → real Postgres; otherwise PGLITE_DATA_DIR → PGLite.
# Baking in a PGLITE_DATA_DIR default made a run without DATABASE_URL silently
# fall back to PGLite's WASM event loop, which busy-waits and burns CPU at idle.
# Now such a run fails loudly ("Set DATABASE_URL or PGLITE_DATA_DIR") instead.
# For the embedded-DB mode, docker-compose.pglite.yml sets PGLITE_DATA_DIR itself.

CMD ["node", "--experimental-strip-types", "server/src/index.ts"]
