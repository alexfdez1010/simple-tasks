import { expect, test } from '@playwright/test';
import {
  clearWorkspace,
  loginWorkspace,
  seedWorkspace,
  workspaceDb,
} from './workspace-fixtures';
let fixtures: Awaited<ReturnType<typeof seedWorkspace>>;
test.beforeEach(async () => {
  fixtures = await seedWorkspace();
});
test.afterEach(async () => {
  await clearWorkspace();
});
test.afterAll(async () => {
  await workspaceDb.$disconnect();
});

/** Proves phone users can inspect a node and reach the complete assigned task form. */
test('opens graph tasks and preserves a phone draft when tapping the backdrop', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page.getByRole('button', { name: new RegExp(fixtures.b.title) }).tap();
  const dialog = page.getByTestId('task-panel');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Edit', exact: true }).tap();
  await dialog
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('Phone draft');
  await page.mouse.click(5, 5);
  await expect(
    dialog.getByRole('textbox', { name: 'Description', exact: true }),
  ).toHaveValue('Phone draft');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).tap();
  await expect(dialog).toHaveCount(0);
});

/** Proves graph zoom remains an ordinary reachable touch control at phone widths. */
test('zooms and fits the dependency canvas on a phone', async ({ page }) => {
  await loginWorkspace(page);
  const world = page.locator('.graph-world');
  const before = await world.getAttribute('style');
  const initialScale = await world.evaluate(
    (element) => new DOMMatrix(getComputedStyle(element).transform).a,
  );
  expect(initialScale).toBeGreaterThanOrEqual(0.85);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).tap();
  await expect(world).not.toHaveAttribute('style', before!);
  await page.getByRole('button', { name: 'Fit', exact: true }).tap();
  const bounds = await world.boundingBox();
  const viewport = await page.locator('.graph-viewport').boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(bounds!.height).toBeLessThanOrEqual(viewport!.height + 1);
});
