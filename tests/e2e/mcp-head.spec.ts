import { createOAuthToken } from './oauth-fixture';
import { expect, test } from '@playwright/test';

test.describe('MCP HEAD probes', () => {
  /** Exercises Next.js routing so HEAD cannot silently fall back to GET. */
  test('rejects an authenticated probe promptly with an empty response', async ({
    request,
  }) => {
    const response = await request.head('/api/mcp/mcp', {
      headers: {
        Authorization: `Bearer ${(await createOAuthToken()).access_token}`,
      },
      timeout: 5_000,
    });

    expect(response.status()).toBe(405);
    expect(response.headers().allow).toBe('POST');
    expect(await response.body()).toHaveLength(0);
  });

  /** Preserves bearer authentication for both missing and forged probe tokens. */
  test('rejects unauthenticated probes without exposing a response body', async ({
    request,
  }) => {
    for (const token of [undefined, 'forged-token']) {
      const response = await request.head('/api/mcp/mcp', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 5_000,
      });

      expect(response.status()).toBe(401);
      expect(response.headers()['www-authenticate']).toContain('Bearer');
      expect(await response.body()).toHaveLength(0);
    }
  });
});
