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

/** Proves task nodes have one semantic activation target and the inspector restores keyboard focus. */
test('opens a dependency node by keyboard and restores focus on dismissal', async ({
  page,
}) => {
  await loginWorkspace(page);
  const node = page.getByRole('button', { name: new RegExp(fixtures.b.title) });
  await node.focus();
  await node.press('Enter');
  await expect(page.getByRole('complementary')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('complementary')).toHaveCount(0);
  await expect(node).toBeFocused();
});
