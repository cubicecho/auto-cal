# Plan: #19 — Personal API keys for external access

**Branch:** `feat/api-keys`
**Scope:** Let a user mint long-lived, revocable API keys that authenticate as them and expose the same `my*` GraphQL surface — primary use case is Home Assistant pulling calendar/todo data on a cron.

## Goal

Today the only credential the server accepts is a 30-day JWT (issued via magic link) and, transitionally, a raw UUID. Neither works for a headless integration: JWTs expire, and the UUID fallback is a known security hole. Add a third auth mechanism — hashed personal API keys, scoped to one user, individually revocable — and surface CRUD for them in Settings.

## Decisions (locked)

1. **Key format:** `acal_<32 random bytes, base64url>` — single opaque token. The `acal_` prefix is how the server recognises the scheme; the body is 43 url-safe chars. No separate "key id" in the token — we look up by hash.
2. **Hashing:** SHA-256 of the full token (high-entropy secret, no need for bcrypt/argon2). Constant-time compare on the hash. Store the hash, not the token.
3. **Display hint:** store the first 8 chars of the random body as `key_prefix` (plain text) so the Settings UI can show "acal_AbCdEfGh…" to identify which key is which. The full token is shown **once** on creation and never again.
4. **Transport:** `Authorization: Bearer acal_<…>`. Reuses the existing header path in `server/src/index.ts` — no new header, no new endpoint.
5. **Scopes:** start with two — `read` and `write`. Stored as `text[]`. Home Assistant only needs `read`. We can split per-resource later; doing so now is premature.
6. **Expiry:** optional `expires_at` (nullable). Default: no expiry, but the UI offers presets (30d / 90d / 1y / never).
7. **Revocation:** soft via `revoked_at` timestamp, not a hard delete. Keeps the audit trail and `last_used_at` history intact. Lookup filters out revoked keys.
8. **No new endpoints.** API keys grant the same `my*` GraphQL surface a logged-in user gets. No separate `/api/v1/...` REST layer — Home Assistant can hit `/graphql` directly. The existing `/ical` endpoint stays as-is (it has its own secret token planned in #24).
9. **No rate limiting in v1.** Hobby project. Add a TODO; revisit if abuse appears.

## Work units

### 1. DB — `api_keys` table

New model file `db/src/models/api_keys.ts`:

```typescript
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                  // user-supplied label, e.g. "Home Assistant"
  keyHash: text('key_hash').notNull().unique(),  // sha256 hex of the full token
  keyPrefix: text('key_prefix').notNull(),       // first 8 chars of random body, for UI display
  scopes: text('scopes').array().notNull().$type<ApiKeyScope[]>().default([]),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
```

`API_KEY_SCOPES = ['read', 'write'] as const` in `db/src/models/enums.ts` (follow the existing enum pattern).

Re-export from `db/src/schema.ts`. Run `npm run db:generate`.

### 2. Server — generation + verification helpers

New file `server/src/api-keys.ts`:

```typescript
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const KEY_PREFIX = 'acal_';
const BODY_BYTES = 32;

export function generateApiKey(): { token: string; hash: string; prefix: string } {
  const body = randomBytes(BODY_BYTES).toString('base64url');
  const token = `${KEY_PREFIX}${body}`;
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash, prefix: body.slice(0, 8) };
}

export function isApiKey(raw: string): boolean {
  return raw.startsWith(KEY_PREFIX);
}

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
```

Unit tests in `server/src/api-keys.test.ts`: round-trip generation, prefix detection, constant-time compare. Follows the existing `auth.test.ts` shape.

### 3. Server — auth chain wiring

In `server/src/index.ts`, extend the context resolver. New order:

1. JWT → return userId
2. Looks-like-an-API-key (`acal_` prefix) → hash, query `api_keys` where `keyHash = ?` AND `revokedAt IS NULL` AND (`expiresAt IS NULL` OR `expiresAt > now`) → return `{ userId, apiKeyId, scopes }`
3. UUID fallback (existing, dev only after #25 lands)

The DB lookup is by `keyHash` only — the hash itself is the lookup key, so this is one indexed query, not a scan. Constant-time compare is implicit (we matched on the hashed value, not the secret).

Update `last_used_at = now()` on successful match. Fire-and-forget (no `await`) — don't block the request on a write.

### 4. Context — carry the auth method

Extend `Context` in `server/src/context.ts`:

```typescript
export interface Context {
  db: DB;
  userId?: string;
  apiKey?: { id: string; scopes: ApiKeyScope[] };  // present iff auth came from an API key
  loaders: ReturnType<typeof createLoaders>;
}
```

Resolvers don't need to care about `apiKey` for v1 — the `userId` check is what scopes the data. The field is there so a future `requireScope('write')` guard has something to check, and so we can deny key-bound requests from minting more keys (see §5).

### 5. GraphQL — CRUD resolvers

Add to the SDL extension in `server/src/schema/resolvers/index.ts`:

```graphql
type ApiKey {
  id: ID!
  name: String!
  keyPrefix: String!
  scopes: [String!]!
  lastUsedAt: String
  expiresAt: String
  createdAt: String!
}

type CreateApiKeyResult {
  apiKey: ApiKey!
  token: String!   # plaintext, returned ONCE
}

extend type Query {
  myApiKeys: [ApiKey!]!
}

extend type Mutation {
  myCreateApiKey(input: CreateApiKeyInput!): CreateApiKeyResult!
  myRevokeApiKey(id: ID!): Boolean!
}

input CreateApiKeyInput {
  name: String!
  scopes: [String!]!
  expiresAt: String
}
```

New resolver file `server/src/schema/resolvers/api-keys.ts` following the existing typed-resolver-map pattern. Validators in `validators.ts`: `name` min 1 / max 60; `scopes` non-empty, subset of `API_KEY_SCOPES`; `expiresAt` must be in the future.

**Important guard:** API-key-bound requests must not be able to mint or revoke keys. In `myCreateApiKey` and `myRevokeApiKey`: `if (context.apiKey) throw new Error('API keys cannot manage other keys')`. Forces management through the web session.

### 6. Client — Settings page

New section on `/settings` (route exists). Components in `client/src/components/domain/settings/`:

- `ApiKeyList` — table: name, prefix (`acal_AbCdEfGh…`), scopes, last used, expires, [Revoke] button
- `CreateApiKeyDialog` — form: name, scope checkboxes, expiry preset dropdown. Submits, then **shows the plaintext token in a one-time reveal modal** with a copy button and clear "you won't see this again" warning
- `RevokeApiKeyDialog` — confirmation; calls `myRevokeApiKey`

Operations colocated under `client/src/operations/api-keys.graphql.ts` (matching existing pattern). Apollo cache: refetch `myApiKeys` after create/revoke — small list, no need for optimistic updates.

### 7. Docs

- New section in `.agents/server-patterns.md`: "API keys — third auth mechanism." Brief — token format, hash storage, the no-self-management guard, where to look (`api-keys.ts`).
- README: a "Connecting Home Assistant" snippet — generate a read-only key in Settings, use it as a Bearer token against `/graphql`, sample query for the next week's schedule.

## Out of scope (deliberate)

- **Rate limiting.** Hobby project. Flag as a follow-up if usage warrants.
- **Per-resource scopes** (e.g. `todos:read`, `habits:write`). Start with `read` / `write`. Split later if real users ask.
- **OAuth / third-party app authorization.** This is *personal* API keys only. A user generates one for their own integration. No client-id/client-secret flow, no consent screen.
- **REST mirror of the GraphQL API.** Home Assistant can POST GraphQL queries natively (it does HTTP+JSON). Don't build a parallel surface.
- **Webhook / outbound integrations.** Pull-only for v1.

## Risk / open questions

- **UUID fallback ordering.** This plan assumes the API-key check runs before the UUID fallback. If #25 lands first and removes the UUID path entirely, no change needed. If #25 is still pending when this ships, document the precedence clearly so the dev UUID path doesn't accidentally shadow an API key (it won't — UUIDs don't start with `acal_` — but the ordering should still be explicit).
- **Logging.** Make sure the token never lands in logs. The hash is fine to log; the raw `Authorization` header is not. Audit `console.log` / error paths in `index.ts` before merging.
- **Migration safety for the unique hash index.** `key_hash` is `unique` — collisions are astronomically unlikely with 256 bits of entropy, but the unique constraint surfaces any accidental hash reuse as a clean error rather than silent overwrite.

## Acceptance

1. User generates a key labelled "Home Assistant" with `read` scope in Settings, copies it once.
2. `curl -H "Authorization: Bearer acal_<token>" -d '{"query":"{ myTodos { id title } }"}' http://localhost:3001/graphql` returns that user's todos.
3. Revoking the key in Settings causes the same curl to return an auth error within one request.
4. The plaintext token is never visible in the API after creation; only `keyPrefix` shows up in `myApiKeys`.
5. A request authenticated with an API key cannot call `myCreateApiKey` or `myRevokeApiKey`.
6. `lastUsedAt` updates on successful auth.
