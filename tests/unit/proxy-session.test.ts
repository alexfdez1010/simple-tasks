import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getProxySession } from '@/lib/auth/proxy-session';

const cookie = '__Secure-better-auth.session_token=signed-session';
const session = {
  user: { id: 'owner', twoFactorEnabled: false, passwordChangeRequired: false },
};
const fetchSession = vi.fn<typeof fetch>();

describe('isolated proxy session validation', () => {
  beforeEach(() => {
    vi.stubEnv('BETTER_AUTH_SECRET', 's'.repeat(48));
    vi.stubEnv('BETTER_AUTH_URL', 'https://tasks.example.com');
    vi.stubGlobal('fetch', fetchSession);
    fetchSession.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each(['', 'session=legacy', 'unrelated=value'])(
    'rejects anonymous and legacy cookies without a network call: %s',
    async (value) => {
      expect(await getProxySession(new Headers({ cookie: value }))).toBeNull();
      expect(fetchSession).not.toHaveBeenCalled();
    },
  );

  it('uses only the canonical origin and forwards cookies without caching or following redirects', async () => {
    fetchSession.mockResolvedValue(Response.json(session));
    const headers = new Headers({ cookie, host: 'attacker.example.com' });
    expect(await getProxySession(headers)).toEqual(session);
    const [url, init] = fetchSession.mock.calls[0];
    expect(String(url)).toBe(
      'https://tasks.example.com/api/auth/get-session?disableRefresh=true',
    );
    expect(init).toMatchObject({
      headers: { cookie },
      cache: 'no-store',
      redirect: 'error',
      signal: expect.any(AbortSignal),
    });
  });

  it('rejects forged or revoked cookies when Better Auth returns no session', async () => {
    fetchSession.mockResolvedValue(Response.json(null));
    expect(await getProxySession(new Headers({ cookie }))).toBeNull();
    expect(fetchSession).toHaveBeenCalledOnce();
  });

  it.each([500, 403, 302])('fails closed on HTTP %s', async (status) => {
    fetchSession.mockResolvedValue(new Response(null, { status }));
    await expect(getProxySession(new Headers({ cookie }))).rejects.toThrow();
  });

  it.each([{}, { user: { id: 'owner', twoFactorEnabled: 'true' } }, 'invalid'])(
    'fails closed on malformed session data: %j',
    async (data) => {
      fetchSession.mockResolvedValue(Response.json(data));
      await expect(getProxySession(new Headers({ cookie }))).rejects.toThrow();
    },
  );

  it('fails closed on network errors', async () => {
    fetchSession.mockRejectedValue(new TypeError('Network unavailable'));
    await expect(getProxySession(new Headers({ cookie }))).rejects.toThrow();
  });
});
