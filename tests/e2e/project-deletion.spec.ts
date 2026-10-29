import { expect, test } from '@playwright/test';
import {
  clearWorkspace,
  loginWorkspace,
  seedWorkspace,
  selectWorkspaceOption,
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

/** Deleting a selected project moves its complete graph, preserves relationships and restores the global view. */
test('deletes a project from Organize while preserving its tasks', async ({
  page,
}) => {
  await loginWorkspace(page);
  await selectWorkspaceOption(page, 'Project', fixtures.project.name);
  await page.getByRole('button', { name: 'Organize', exact: true }).click();
  const management = page.getByRole('dialog');
  await management.getByRole('tab', { name: 'Projects', exact: true }).click();
  await management
    .getByRole('button', {
      name: `Delete project ${fixtures.project.name}`,
      exact: true,
    })
    .click();
  const confirmation = page.getByRole('alertdialog');
  await expect(confirmation).toContainText(
    'Their content and dependencies will be preserved',
  );
  const destination = await workspaceDb.project.findUniqueOrThrow({
    where: { id: 'project-general' },
  });
  await selectWorkspaceOption(confirmation, 'Move tasks to', destination.name);
  await confirmation
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  expect(
    await workspaceDb.project.count({ where: { id: fixtures.project.id } }),
  ).toBe(1);
  await management
    .getByRole('button', {
      name: `Delete project ${fixtures.project.name}`,
      exact: true,
    })
    .click();
  await selectWorkspaceOption(confirmation, 'Move tasks to', destination.name);
  await confirmation
    .getByRole('button', { name: 'Delete project', exact: true })
    .click();
  await expect(confirmation).toHaveCount(0);
  await expect(
    management.getByText(fixtures.project.name, { exact: true }),
  ).toHaveCount(0);
  expect(
    await workspaceDb.project.count({ where: { id: fixtures.project.id } }),
  ).toBe(0);
  for (const task of [fixtures.a, fixtures.b]) {
    expect(
      await workspaceDb.task.findUnique({ where: { id: task.id } }),
    ).toMatchObject({
      projectId: 'project-general',
      statusId: task.statusId,
      description: task.description,
    });
  }
  expect(
    await workspaceDb.taskDependency.count({
      where: { taskId: fixtures.b.id, dependsOnId: fixtures.a.id },
    }),
  ).toBe(1);
  await management.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(
    page
      .locator('.workspace-header')
      .getByRole('button', { name: /All projects/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: new RegExp(fixtures.a.title) }),
  ).toBeVisible();
});
