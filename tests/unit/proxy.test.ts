import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

const { getProxySession } = vi.hoisted(() => ({ getProxySession: vi.fn() }));
vi.mock('@/lib/auth/proxy-session', () => ({ getProxySession }));

describe('protected page proxy', () => {
  beforeEach(() => {
    getProxySession.mockReset();
  });

  it.each(['/api/auth/get-session', '/login', '/register', '/api/mcp/mcp'])(
    'does not recursively validate public routes: %s',
    async (path) => {
      const response = await proxy(
        new NextRequest(`https://tasks.test${path}`),
      );
      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(getProxySession).not.toHaveBeenCalled();
    },
  );

  it('sends invalid sessions to login preserving the destination', async () => {
    getProxySession.mockResolvedValue(null);
    const response = await proxy(
      new NextRequest('https://tasks.test/board?q=1'),
    );
    expect(response.headers.get('location')).toBe(
      'https://tasks.test/login?next=%2Fboard%3Fq%3D1',
    );
  });

  it.each([
    { twoFactorEnabled: false, passwordChangeRequired: false },
    { twoFactorEnabled: true, passwordChangeRequired: true },
  ])('requires security setup for %j', async (user) => {
    getProxySession.mockResolvedValue({ user });
    const response = await proxy(new NextRequest('https://tasks.test/'));
    expect(response.headers.get('location')).toBe(
      'https://tasks.test/security',
    );
    const security = await proxy(
      new NextRequest('https://tasks.test/security'),
    );
    expect(security.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows protected pages after verified enrollment', async () => {
    getProxySession.mockResolvedValue({
      user: { twoFactorEnabled: true, passwordChangeRequired: false },
    });
    const response = await proxy(new NextRequest('https://tasks.test/'));
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('returns an uncached temporary error without allowing access when validation fails', async () => {
    getProxySession.mockRejectedValue(new Error('Unavailable'));
    const response = await proxy(
      new NextRequest('https://tasks.test/security'),
    );
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('retry-after')).toBe('5');
    expect(response.headers.get('x-middleware-next')).toBeNull();
  });
});
