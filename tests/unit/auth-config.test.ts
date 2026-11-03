import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuthConfig } from '@/lib/auth/config';

describe('Better Auth configuration', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('requires an independent strong secret', () => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'short');
    expect(getAuthConfig).toThrow('32');
  });
  it('requires a canonical URL and HTTPS outside localhost', () => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'a'.repeat(48));
    vi.stubEnv('BETTER_AUTH_URL', '');
    expect(getAuthConfig).toThrow('BETTER_AUTH_URL');
    vi.stubEnv('BETTER_AUTH_URL', 'http://example.com');
    expect(getAuthConfig).toThrow('HTTPS');
    vi.stubEnv('BETTER_AUTH_URL', 'https://tasks.example.com/');
    expect(getAuthConfig()).toEqual({
      secret: 'a'.repeat(48),
      baseURL: 'https://tasks.example.com',
    });
  });
});
