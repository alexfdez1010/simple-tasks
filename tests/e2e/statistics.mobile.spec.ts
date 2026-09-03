import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const PASSWORD = process.env.PASSWORD ?? 'dev-password';

/** Authenticates the emulated mobile browser and opens statistics. */
async function openStatistics(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Statistics' }).click();
  await expect(page.getByRole('heading', { name: 'Statistics' })).toBeVisible();
}

test.describe('mobile configurable statistics', () => {
  /** Proves the canvas and editor remain reachable inside a phone viewport. */
  test('opens the responsive statistic editor', async ({ page }) => {
    await openStatistics(page);
    await expect(
      page.getByRole('heading', { name: 'Completed tasks' }),
    ).toBeInViewport();
    await page.getByRole('button', { name: 'Add statistic' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create statistic' });
    await expect(dialog).toBeInViewport();
    await expect(dialog.getByLabel('Name')).toBeVisible();
    await expect(dialog.getByText('Color palette')).toBeVisible();
    await expect(dialog.getByText('Card format')).toBeVisible();
    await expect(dialog.getByRole('radio', { name: 'Forest' })).toBeVisible();
    await expect(
      dialog.getByRole('radio', { name: 'Full width' }),
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Period/ })).toBeVisible();
    await expect(
      dialog.getByText('Leave empty to include every status.'),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
  });
});
