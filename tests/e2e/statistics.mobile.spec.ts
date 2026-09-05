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

/** Proves glass panels fit narrow screens and focus can be reversed by touch. */
test('keeps statistics and focus controls within a narrow viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await openStatistics(page);
  const focus = page.getByRole('button', { name: 'Focus view' });
  await focus.tap();
  await expect(focus).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: 'Edit: Completed tasks', exact: true }),
  ).toBeHidden();
  await focus.tap();
  await expect(
    page.getByRole('button', { name: 'Edit: Completed tasks', exact: true }),
  ).toBeVisible();
  const panels = await page
    .locator('.statistics-widget, .statistics-header')
    .evaluateAll((elements) =>
      elements.map((element) => ({
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
        overflow: element.scrollWidth > element.clientWidth,
      })),
    );
  for (const panel of panels) {
    expect(panel.left).toBeGreaterThanOrEqual(0);
    expect(panel.right).toBeLessThanOrEqual(320);
    expect(panel.overflow).toBe(false);
  }
});
