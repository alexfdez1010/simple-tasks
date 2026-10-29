import { expect, test } from '@playwright/test';
import {
  clearWorkspace,
  loginWorkspace,
  seedWorkspace,
  workspaceDb,
  WORKSPACE_PREFIX,
} from './workspace-fixtures';
const propertyName = WORKSPACE_PREFIX + 'areas';
let fixtures: Awaited<ReturnType<typeof seedWorkspace>>;
test.beforeEach(async () => {
  fixtures = await seedWorkspace();
  await workspaceDb.taskPropertyDefinition.create({
    data: {
      name: propertyName,
      type: 'MULTI_SELECT',
      options: ['Frontend', 'Backend'],
      position: 100,
    },
  });
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

/** Proves multi-select property values remain usable in the responsive task editor. */
test('assigns multiple property values from a phone', async ({ page }) => {
  await loginWorkspace(page);
  await page.getByRole('button', { name: new RegExp(fixtures.a.title) }).tap();
  const dialog = page.getByTestId('task-panel');
  await dialog.getByRole('button', { name: 'Edit', exact: true }).tap();
  await dialog
    .getByRole('button', { name: new RegExp(`^(?!Clear ).*${propertyName}`) })
    .tap();
  await page.getByRole('option', { name: 'Frontend', exact: true }).tap();
  await page.getByRole('option', { name: 'Backend', exact: true }).tap();
  await page.keyboard.press('Escape');
  await dialog.getByRole('button', { name: 'Save', exact: true }).tap();
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
  ).toMatchObject({ value: ['Frontend', 'Backend'] });
});
