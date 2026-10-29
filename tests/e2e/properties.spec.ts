import { expect, test } from '@playwright/test';
import {
  clearWorkspace,
  loginWorkspace,
  seedWorkspace,
  selectWorkspaceOption,
  workspaceDb,
  WORKSPACE_PREFIX,
} from './workspace-fixtures';
const propertyName = WORKSPACE_PREFIX + 'priority';
let fixtures: Awaited<ReturnType<typeof seedWorkspace>>;
test.beforeEach(async () => {
  fixtures = await seedWorkspace();
});
test.afterEach(async () => {
  await clearWorkspace();
  await workspaceDb.taskPropertyDefinition.deleteMany({
    where: { name: propertyName },
  });
});
test.afterAll(async () => {
  await workspaceDb.$disconnect();
});

/** Proves property configuration remains available and its typed fields work inside the new graph editor. */
test('creates a selectable property and saves its value on an assigned task', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page.getByRole('button', { name: /^Settings/ }).click();
  const settings = page.getByRole('dialog', { name: /^Settings/ });
  await settings.getByRole('tab', { name: 'Properties', exact: true }).click();
  await settings
    .getByRole('button', { name: 'Add property', exact: true })
    .click();
  await settings.getByRole('textbox', { name: /^Name/ }).fill(propertyName);
  await selectWorkspaceOption(settings, 'Type', 'Select');
  await settings
    .getByRole('button', { name: 'Add option', exact: true })
    .click();
  await settings
    .getByRole('textbox', { name: 'Option 1', exact: true })
    .fill('High');
  await settings
    .getByRole('button', { name: 'Create property', exact: true })
    .click();
  await expect(settings.getByText(propertyName, { exact: true })).toBeVisible();
  await settings.getByRole('button', { name: 'Done', exact: true }).click();
  await page
    .getByRole('button', { name: new RegExp(fixtures.a.title) })
    .click();
  const dialog = page.getByTestId('task-panel');
  await dialog.getByRole('button', { name: 'Edit', exact: true }).click();
  await selectWorkspaceOption(dialog, propertyName, 'High');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const property = await workspaceDb.taskPropertyDefinition.findUniqueOrThrow({
    where: { name: propertyName },
  });
  expect(
    await workspaceDb.taskPropertyValue.findUnique({
      where: {
        taskId_propertyId: { taskId: fixtures.a.id, propertyId: property.id },
      },
    }),
  ).toMatchObject({ value: 'High' });
});
