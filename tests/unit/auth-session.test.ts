import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/constants';
import { createSessionToken } from '@/lib/auth/token';

const cookieDelete = vi.fn();
const cookieGet = vi.fn();
const cookieSet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    delete: cookieDelete,
    get: cookieGet,
    set: cookieSet,
  })),
}));

describe('browser session lifecycle', () => {
  /** Installs isolated credentials before each session test. */
  beforeEach(() => {
    vi.stubEnv('PASSWORD', 'correct-password');
    vi.stubEnv('AUTH_SECRET', 'unit-secret');
    vi.stubEnv('NODE_ENV', 'test');
  });

  /** Restores the caller's environment after every session test. */
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** Proves invalid passwords neither authenticate nor issue a cookie. */
  it('rejects an invalid password without mutating cookies', async () => {
    const { createSession } = await import('@/lib/auth/session');

    await expect(createSession('wrong-password')).resolves.toBe(false);
    expect(cookieSet).not.toHaveBeenCalled();
  });

  /** Proves valid sessions use hardened, scoped cookie attributes. */
  it('issues an HttpOnly same-site session cookie', async () => {
    const { createSession } = await import('@/lib/auth/session');
    const expectedToken = await createSessionToken(
      'correct-password',
      'unit-secret',
    );

    await expect(createSession('correct-password')).resolves.toBe(true);
    expect(cookieSet).toHaveBeenCalledWith(AUTH_COOKIE, expectedToken, {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  /** Proves missing, forged, and valid cookie values are distinguished. */
  it('validates the current cookie against active credentials', async () => {
    const { isAuthenticated } = await import('@/lib/auth/session');
    cookieGet.mockReturnValueOnce(undefined);
    await expect(isAuthenticated()).resolves.toBe(false);

    cookieGet.mockReturnValueOnce({ value: 'forged' });
    await expect(isAuthenticated()).resolves.toBe(false);

    cookieGet.mockReturnValueOnce({
      value: await createSessionToken('correct-password', 'unit-secret'),
    });
    await expect(isAuthenticated()).resolves.toBe(true);
  });

  /** Proves logout removes only the application session cookie. */
  it('deletes the named session cookie on logout', async () => {
    const { destroySession } = await import('@/lib/auth/session');

    await destroySession();
    expect(cookieDelete).toHaveBeenCalledWith(AUTH_COOKIE);
  });
});
