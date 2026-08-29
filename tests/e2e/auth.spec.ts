import { expect, test } from '@playwright/test';

const PASSWORD = process.env.PASSWORD ?? 'dev-password';
const MCP_TOKEN = process.env.MCP_TOKEN ?? 'dev-mcp-token';

test.describe('shared-password gateway', () => {
  /** Proves protected pages redirect anonymous visitors to login. */
  test('redirects an unauthenticated visitor', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your board' }),
    ).toBeVisible();
  });

  /** Proves an invalid password is rejected without leaving the gateway. */
  test('rejects an incorrect password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Password').fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Incorrect password.')).toBeVisible();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
  });

  /** Proves a valid password creates a session and opens the board. */
  test('accepts the configured password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tasks' }),
    ).toBeVisible();
  });

  /** Proves authenticated users can reveal the dynamically rendered MCP token. */
  test('reveals the configured MCP token on the AI setup page', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('link', { name: 'AI' }).click();

    const token = page.getByLabel('MCP token');
    await expect(page).toHaveURL(/\/skill$/);
    await expect(token).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Reveal token' }).click();
    await expect(token).toHaveAttribute('type', 'text');
    await expect(token).toHaveValue(MCP_TOKEN);
  });
});
