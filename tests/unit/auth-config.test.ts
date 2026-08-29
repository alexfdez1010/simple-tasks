import { afterEach, describe, expect, it, vi } from 'vitest';

import { getAuthConfig } from '@/lib/auth/config';

describe('authentication configuration', () => {
  /** Restores process configuration after every isolation case. */
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** Proves both required secrets are returned without transformation. */
  it('reads a complete shared-password configuration', () => {
    vi.stubEnv('PASSWORD', 'unit-password');
    vi.stubEnv('AUTH_SECRET', 'unit-secret');

    expect(getAuthConfig()).toEqual({
      password: 'unit-password',
      secret: 'unit-secret',
    });
  });

  /** Proves startup cannot silently proceed without the shared password. */
  it('rejects a missing password', () => {
    vi.stubEnv('PASSWORD', '');
    vi.stubEnv('AUTH_SECRET', 'unit-secret');

    expect(() => getAuthConfig()).toThrow('PASSWORD is required.');
  });

  /** Proves startup cannot silently proceed without the signing secret. */
  it('rejects a missing authentication secret', () => {
    vi.stubEnv('PASSWORD', 'unit-password');
    vi.stubEnv('AUTH_SECRET', '');

    expect(() => getAuthConfig()).toThrow('AUTH_SECRET is required.');
  });
});
