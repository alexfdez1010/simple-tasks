import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isAuthenticated,
  requireAuthenticated,
  destroySession,
} from '@/lib/auth/session';
const { getSession, signOut } = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('@/lib/auth/server', () => ({
  auth: { api: { getSession, signOut } },
}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'session' }),
}));

describe('revocable database sessions', () => {
  beforeEach(() => getSession.mockReset());
  it('rejects missing sessions and incomplete 2FA enrollment', async () => {
    getSession.mockResolvedValue(null);
    expect(await isAuthenticated()).toBe(false);
    await expect(requireAuthenticated()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    getSession.mockResolvedValue({ user: { twoFactorEnabled: false } });
    expect(await isAuthenticated()).toBe(false);
    await expect(requireAuthenticated()).rejects.toThrow();
  });
  it('requires a validated Better Auth session with completed enrollment', async () => {
    getSession.mockResolvedValue({ user: { twoFactorEnabled: true } });
    expect(await isAuthenticated()).toBe(true);
    await expect(requireAuthenticated()).resolves.toBeUndefined();
  });
  it('revokes the session through Better Auth on logout', async () => {
    await destroySession();
    expect(signOut).toHaveBeenCalledWith({ headers: expect.any(Headers) });
  });
});
