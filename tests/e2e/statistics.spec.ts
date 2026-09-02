import { expect, test } from '@playwright/test';

const PASSWORD = process.env.PASSWORD ?? 'dev-password';

/** Signs in through the shared-password form. */
async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
}

test.describe('statistics', () => {
  /** Proves the protected board exposes a working dedicated analytics route. */
  test('navigates to statistics and back to the board', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Statistics' }).click();

    await expect(page).toHaveURL(/\/statistics$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Statistics' }),
    ).toBeVisible();
    await expect(page.getByText('Average resolution time')).toBeVisible();
    await expect(
      page.getByText('Completed tasks', { exact: true }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Back to board' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tasks' }),
    ).toBeVisible();
  });
});
