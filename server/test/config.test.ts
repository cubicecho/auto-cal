import { afterEach, describe, expect, it, vi } from 'vitest';
import { magicLinkExposed, magicLinkRequired } from '../src/config.ts';

describe('magicLinkExposed', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is enabled outside production regardless of the flag', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('EXPOSE_MAGIC_LINK', undefined);
    expect(magicLinkExposed()).toBe(true);
  });

  it('is disabled in production by default', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('EXPOSE_MAGIC_LINK', undefined);
    expect(magicLinkExposed()).toBe(false);
  });

  it('is enabled in production when EXPOSE_MAGIC_LINK is truthy', () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const v of ['1', 'true', 'TRUE', 'yes', ' Yes ']) {
      vi.stubEnv('EXPOSE_MAGIC_LINK', v);
      expect(magicLinkExposed()).toBe(true);
    }
  });

  it('stays disabled in production for falsy/unknown flag values', () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const v of ['', '0', 'false', 'no', 'off']) {
      vi.stubEnv('EXPOSE_MAGIC_LINK', v);
      expect(magicLinkExposed()).toBe(false);
    }
  });
});

describe('magicLinkRequired', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is required when AUTH_MAGIC_LINK is unset, in any environment', () => {
    vi.stubEnv('AUTH_MAGIC_LINK', undefined);
    for (const env of ['development', 'production']) {
      vi.stubEnv('NODE_ENV', env);
      expect(magicLinkRequired()).toBe(true);
    }
  });

  it('is off only for explicit falsy values', () => {
    for (const v of ['0', 'false', 'FALSE', 'no', ' No ']) {
      vi.stubEnv('AUTH_MAGIC_LINK', v);
      expect(magicLinkRequired()).toBe(false);
    }
  });

  it('stays required for truthy, empty or unknown values', () => {
    for (const v of ['', '1', 'true', 'off', 'disabled']) {
      vi.stubEnv('AUTH_MAGIC_LINK', v);
      expect(magicLinkRequired()).toBe(true);
    }
  });
});
