import { afterEach, describe, expect, it, vi } from 'vitest';
import { magicLinkExposed } from '../src/config.ts';

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
