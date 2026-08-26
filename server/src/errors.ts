import { GraphQLError } from 'graphql';

/**
 * Error codes surfaced to clients as `extensions.code`.
 *
 * Everything thrown from a resolver used to be a bare `Error`, so every failure
 * reached the client as INTERNAL_SERVER_ERROR and the only way to tell an auth
 * failure from a missing row was to match on the message text — which the
 * client did, in `apollo-client.ts`, to decide whether to drop the session.
 * Codes make that a structural check and let `formatError` scrub the messages
 * of genuinely unexpected errors without breaking it.
 */
export const ErrorCode = {
  Unauthenticated: 'UNAUTHENTICATED',
  Forbidden: 'FORBIDDEN',
  NotFound: 'NOT_FOUND',
  BadUserInput: 'BAD_USER_INPUT',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** No usable credentials on the request. The client should re-authenticate. */
export function unauthenticated(): GraphQLError {
  return new GraphQLError('Not authenticated', {
    extensions: { code: ErrorCode.Unauthenticated },
  });
}

/** Authenticated, but the row belongs to someone else. */
export function forbidden(message = 'Forbidden'): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: ErrorCode.Forbidden },
  });
}

/** Row does not exist. Message shape matches the previous bare Errors. */
export function notFound(entity: string, id: string): GraphQLError {
  return new GraphQLError(`${entity} ${id} not found`, {
    extensions: { code: ErrorCode.NotFound, entity, id },
  });
}

/** Caller-fixable input problem: failed validation, an illegal state change. */
export function badUserInput(
  message: string,
  extensions: Record<string, unknown> = {},
): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: ErrorCode.BadUserInput, ...extensions },
  });
}

/**
 * Narrow an unauthenticated context to a user id.
 *
 * Replaces `if (!context.userId) throw new Error('Not authenticated')`, which
 * appeared 48 times. Returning the id (rather than asserting) means callers
 * stop reaching for `context.userId!` afterwards.
 */
export function requireUser(context: { userId?: string }): string {
  if (!context.userId) throw unauthenticated();
  return context.userId;
}

/**
 * Collapse the existence + ownership guard pair into one call.
 *
 * Keeps the order documented in CLAUDE.md — existence, then ownership — and the
 * exact messages the hand-written pairs produced, so this is a pure refactor.
 *
 * Note the tradeoff that order carries: a row owned by someone else answers
 * FORBIDDEN rather than NOT_FOUND, which confirms the id exists. Answering
 * NOT_FOUND for both would close that, but it is a behaviour change with its
 * own debugging cost, so it is left as-is here rather than smuggled into a
 * refactor.
 */
export function requireOwner<T extends { userId: string }>(
  row: T | undefined,
  entity: string,
  id: string,
  userId: string,
): T {
  if (!row) throw notFound(entity, id);
  if (row.userId !== userId) throw forbidden();
  return row;
}
