import { describe, expect, it, vi } from 'vitest';
import { signMagicToken, signSessionToken, verifyToken } from '../src/auth.ts';

describe('signMagicToken / verifyToken', () => {
  it('issues a token that verifies with the correct email claim', async () => {
    const token = await signMagicToken('user@example.com');
    const payload = await verifyToken(token);
    expect(payload?.email).toBe('user@example.com');
    expect(payload?.sub).toBeUndefined();
  });

  it('returns null for an invalid token string', async () => {
    expect(await verifyToken('not.a.valid.jwt')).toBeNull();
  });

  it('returns null for an empty string', async () => {
    expect(await verifyToken('')).toBeNull();
  });

  it('returns null for an expired magic link token', async () => {
    const token = await signMagicToken('user@example.com');
    // Magic tokens expire after 15 minutes — advance the clock past that
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 16 * 60 * 1000));
    const result = await verifyToken(token);
    vi.useRealTimers();
    expect(result).toBeNull();
  });
});

describe('signSessionToken / verifyToken', () => {
  it('issues a session token with userId as sub and email claim', async () => {
    const token = await signSessionToken('user-abc-123', 'user@example.com');
    const payload = await verifyToken(token);
    expect(payload?.sub).toBe('user-abc-123');
    expect(payload?.email).toBe('user@example.com');
  });

  it('preserves email casing exactly as provided', async () => {
    const token = await signSessionToken('u1', 'User@Example.COM');
    const payload = await verifyToken(token);
    expect(payload?.email).toBe('User@Example.COM');
  });
});
