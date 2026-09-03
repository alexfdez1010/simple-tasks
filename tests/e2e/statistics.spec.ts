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
    await expect(
      page.getByRole('heading', { name: 'Average resolution time' }),
    ).toBeVisible();
    await expect(
      page.getByText('Completed tasks', { exact: true }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Back to board' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tasks' }),
    ).toBeVisible();
  });

  /** Proves a user can add, rename, and remove a statistic from the canvas. */
  test('manages a configurable statistic', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Statistics' }).click();
    const name = `E2E task count ${process.pid}`;
    const renamed = `${name} updated`;

    await page.getByRole('button', { name: 'Add statistic' }).click();
    const createDialog = page.getByRole('dialog', { name: 'Create statistic' });
    await createDialog.getByLabel('Name').fill(name);
    await createDialog.getByRole('button', { name: /Period/ }).click();
    await page
      .getByRole('option', { exact: true, name: 'Last 30 days' })
      .click();
    await expect(
      createDialog.getByRole('button', { name: /Date field/ }),
    ).toBeVisible();
    await createDialog.getByRole('button', { name: 'Add to canvas' }).click();
    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expect(
      page.getByText('Task count · All tasks · Last 30 days', { exact: true }),
    ).toBeVisible();

    await page.getByRole('button', { name: `Edit: ${name}` }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit statistic' });
    await editDialog.getByLabel('Name').fill(renamed);
    await editDialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('heading', { name: renamed })).toBeVisible();

    await page.getByRole('button', { name: `Delete: ${renamed}` }).click();
    const deleteDialog = page.getByRole('dialog', { name: 'Delete statistic' });
    await deleteDialog.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: renamed })).toHaveCount(0);
  });
});
