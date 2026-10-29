import { expect, test } from '@playwright/test';
import { loginWorkspace } from './workspace-fixtures';

/** Verifies the retained integration paths and absence of retired configuration and endpoints. */
test('keeps MCP and REST connections while retiring task webhooks', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page.goto('/connections');
  await expect(
    page.getByRole('heading', { name: 'Connections', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /agent|MCP/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /API/i })).toBeVisible();
  await expect(page.getByText(/webhook/i)).toHaveCount(0);
  for (const path of ['/webhook-docs', '/api/webhooks/dispatch']) {
    const response = await page.request.get(path);
    expect(response.status()).toBe(404);
  }
  const response = await page.request.post('/api/webhooks/dispatch');
  expect(response.status()).toBe(404);
});
