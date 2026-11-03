import { expect, test } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createOTP } from '@better-auth/utils/otp';
import {
  authDb,
  loginOwner,
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_TOTP_SECRET,
} from './auth-fixture';
import { beginOAuth, exchangeCode, BASE_URL } from './oauth-fixture';

test.use({ extraHTTPHeaders: { Origin: BASE_URL } });

for (const full of [false, true]) {
  test(`OAuth consent enforces ${full ? 'full access' : 'read-only'} and immediate revocation`, async ({
    page,
  }) => {
    await loginOwner(page);
    const flow = await beginOAuth(page.request);
    await page.route('http://127.0.0.1:4545/callback**', (route) =>
      route.fulfill({ body: 'Authorized' }),
    );
    await page.goto(flow.url);
    await expect(
      page.getByRole('heading', { name: 'Authorize MCP connection' }),
    ).toBeVisible();
    await expect(
      page.getByRole('radio', { name: 'Read only', exact: true }),
    ).toBeChecked();
    if (full) await page.getByText('Full access', { exact: true }).click();
    await page.screenshot({
      path: `.impeccable/review/oauth-${full ? 'full' : 'read'}.png`,
    });
    await page.getByRole('button', { name: 'Authorize', exact: true }).click();
    await expect(page).toHaveURL(/127\.0\.0\.1:4545\/callback\?code=/);
    const code = new URL(page.url()).searchParams.get('code')!;
    const exchange = await exchangeCode(page.request, flow, code);
    expect(exchange.ok()).toBe(true);
    const tokens = await exchange.json();
    expect(tokens.scope.split(' ').includes('tasks:write')).toBe(full);
    const client = new Client({
      name: 'scope-security-test',
      version: '1.0.0',
    });
    const transport = new StreamableHTTPClientTransport(
      new URL('/api/mcp/mcp', BASE_URL),
      {
        requestInit: {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        },
      },
    );
    try {
      await client.connect(transport);
      const catalog = await client.listTools();
      expect(catalog.tools.some((tool) => tool.name === 'create_task')).toBe(
        full,
      );
      if (!full) {
        const before = await authDb.task.count();
        expect(
          await client.callTool({
            name: 'create_task',
            arguments: { title: 'unauthorized write' },
          }),
        ).toMatchObject({ isError: true });
        expect(await authDb.task.count()).toBe(before);
      }
      const refresh = await page.request.post('/api/auth/oauth2/token', {
        form: {
          grant_type: 'refresh_token',
          refresh_token: tokens.refresh_token,
          client_id: flow.clientId,
          resource: `${BASE_URL}/api/mcp/mcp`,
        },
      });
      expect(refresh.ok(), await refresh.text()).toBe(true);
      const refreshed = await refresh.json();
      expect(refreshed.refresh_token).not.toBe(tokens.refresh_token);
      await page.goto('/security');
      await page
        .getByRole('listitem')
        .filter({ hasText: flow.name })
        .getByRole('button', { name: 'Revoke access' })
        .click();
      await expect(page.getByText(flow.name, { exact: true })).toHaveCount(0);
      for (const token of [tokens.access_token, refreshed.access_token]) {
        const revoked = await page.request.post('/api/mcp/mcp', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json, text/event-stream',
          },
          data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
        });
        expect(revoked.status()).toBe(401);
      }
      const revokedRefresh = await page.request.post('/api/auth/oauth2/token', {
        form: {
          grant_type: 'refresh_token',
          refresh_token: refreshed.refresh_token,
          client_id: flow.clientId,
          resource: `${BASE_URL}/api/mcp/mcp`,
        },
      });
      expect(revokedRefresh.status()).toBe(400);
      expect((await exchangeCode(page.request, flow, code)).status()).toBe(400);
    } finally {
      await client.close();
    }
  });
}

test('rejects modified consent requests', async ({ page }) => {
  await loginOwner(page);
  const flow = await beginOAuth(page.request);
  const authorize = await page.request.get(flow.url, { maxRedirects: 0 });
  const modified = new URL(authorize.headers().location, BASE_URL);
  modified.searchParams.set('scope', 'tasks:read tasks:write injected');
  await page.goto(modified.toString());
  await expect(
    page.getByRole('heading', {
      name: 'The authorization request is invalid or has expired',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Authorize', exact: true }),
  ).toHaveCount(0);
});

/** Exercises the discovery-driven login continuation instead of starting with an existing session. */
test('resumes anonymous OAuth authorization after password and authenticator', async ({
  page,
}) => {
  await authDb.rateLimit.deleteMany();
  const flow = await beginOAuth(page.request);
  await page.goto(flow.url);
  await expect(page).toHaveURL(/\/login\?/);
  await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page
    .getByLabel('Authenticator code', { exact: true })
    .fill(await createOTP(TEST_TOTP_SECRET).totp());
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Authorize MCP connection' }),
  ).toBeVisible();
  await expect(
    page.getByRole('radio', { name: 'Read only', exact: true }),
  ).toBeChecked();
});
