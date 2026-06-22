import { describe, expect, it } from 'vitest';
import {
  constantTimeEqual,
  generateApiKey,
  hashApiKey,
  isApiKey,
} from '../src/api-keys.ts';

describe('generateApiKey', () => {
  it('returns a token with the acal_ prefix', () => {
    const { token } = generateApiKey();
    expect(token.startsWith('acal_')).toBe(true);
  });

  it('round-trips: hashing the token matches the stored hash', () => {
    const { token, hash } = generateApiKey();
    expect(hashApiKey(token)).toBe(hash);
  });

  it('produces unique tokens on each call', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).not.toBe(b.hash);
  });

  it('prefix is the first 8 chars of the raw random part', () => {
    const { token, prefix } = generateApiKey();
    // token = "acal_" + raw; prefix = raw.slice(0, 8)
    const raw = token.slice('acal_'.length);
    expect(raw.startsWith(prefix)).toBe(true);
    expect(prefix).toHaveLength(8);
  });
});

describe('isApiKey', () => {
  it('returns true for acal_ prefixed tokens', () => {
    expect(isApiKey('acal_abc123')).toBe(true);
  });

  it('returns false for JWT tokens', () => {
    expect(isApiKey('eyJhbGciOiJIUzI1NiJ9.abc.def')).toBe(false);
  });

  it('returns false for raw UUIDs', () => {
    expect(isApiKey('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isApiKey('')).toBe(false);
  });
});

describe('constantTimeEqual', () => {
  it('returns true for equal strings', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
  });

  it('returns false for different-length strings', () => {
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
  });

  it('returns false for same-length but different strings', () => {
    expect(constantTimeEqual('abc', 'xyz')).toBe(false);
  });

  it('returns false for empty vs non-empty', () => {
    expect(constantTimeEqual('', 'a')).toBe(false);
  });

  it('returns true for two empty strings', () => {
    expect(constantTimeEqual('', '')).toBe(true);
  });
});
