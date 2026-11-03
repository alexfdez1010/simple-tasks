import { describe, expect, it, vi } from 'vitest';
import { hasActiveMcpGrant } from '@/lib/mcp/auth';
const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ db: { oauthConsent: { findFirst } } }));

describe('live MCP authorization', () => {
  it('rejects revoked grants and permissions removed since token issuance', async () => {
    findFirst.mockResolvedValue(null);
    expect(await hasActiveMcpGrant('owner', 'client', ['tasks:read'])).toBe(
      false,
    );
    findFirst.mockResolvedValue({ scopes: ['tasks:read'] });
    expect(
      await hasActiveMcpGrant('owner', 'client', ['tasks:read', 'tasks:write']),
    ).toBe(false);
    expect(await hasActiveMcpGrant('owner', 'client', ['tasks:read'])).toBe(
      true,
    );
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: { twoFactorEnabled: true, passwordChangeRequired: false },
          oauthclient: { disabled: false },
        }),
      }),
    );
  });
});
