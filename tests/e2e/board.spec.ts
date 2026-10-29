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

/** Proves the graph inspector still exposes safe Markdown and a working edit flow. */
test('reads Markdown and edits an assigned task without changing its relationships', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page
    .getByRole('button', { name: new RegExp(fixtures.a.title) })
    .click();
  const dialog = page.getByTestId('task-panel');
  await expect(dialog.locator('strong')).toHaveText('Acceptance criteria');
  await dialog.getByRole('button', { name: 'Edit', exact: true }).click();
  await dialog
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('Updated **deliverable**');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    await workspaceDb.task.findUnique({ where: { id: fixtures.a.id } }),
  ).toMatchObject({
    assigneeId: fixtures.person.id,
    description: 'Updated **deliverable**',
  });
});

/** Proves referenced tasks cannot be deleted and independent tasks can be removed after confirmation. */
test('protects prerequisites from deletion and deletes unreferenced work', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page
    .getByRole('button', { name: new RegExp(fixtures.a.title) })
    .click();
  await page
    .getByTestId('task-panel')
    .getByRole('button', { name: 'Delete task', exact: true })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete task', exact: true })
    .click();
  await expect(page.getByRole('alertdialog').getByRole('alert')).toContainText(
    'prerequisite',
  );
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await page
    .getByTestId('task-panel')
    .getByRole('button', { name: 'Close', exact: true })
    .click();
  await page
    .getByRole('button', { name: new RegExp(fixtures.b.title) })
    .click();
  await page
    .getByTestId('task-panel')
    .getByRole('button', { name: 'Delete task', exact: true })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete task', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: new RegExp(fixtures.b.title) }),
  ).toHaveCount(0);
});
