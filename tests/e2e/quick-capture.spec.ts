import { expect, test } from '@playwright/test';
import {
  clearWorkspace,
  loginWorkspace,
  seedWorkspace,
  selectWorkspaceOption,
  workspaceDb,
  WORKSPACE_PREFIX,
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

/** Proves a failed server action preserves the complete explicitly assigned draft for retry. */
test('retains task input after a failed save and retries successfully', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  const dialog = page.getByTestId('task-panel');
  await dialog
    .getByRole('textbox', { name: /^Title/ })
    .fill(WORKSPACE_PREFIX + 'retry');
  await selectWorkspaceOption(dialog, 'Responsible party', fixtures.agent.name);
  await page.route('**/', async (route) => {
    if (route.request().method() === 'POST') await route.abort();
    else await route.continue();
  });
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: /^Title/ })).toHaveValue(
    WORKSPACE_PREFIX + 'retry',
  );
  await expect(dialog.getByRole('alert')).toBeVisible();
  await page.unroute('**/');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});
