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

test('shows actual dependency edges, assignee colors and project filtering', async ({
  page,
}) => {
  await loginWorkspace(page);
  const first = page.getByRole('button', {
    name: new RegExp(fixtures.a.title),
  });
  const second = page.getByRole('button', {
    name: new RegExp(fixtures.b.title),
  });
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await expect(first).toHaveAttribute('style', /#C3986A/);
  await expect(second).toHaveAttribute('style', /#7297CA/);
  await expect(page.locator('.graph-edge')).toHaveCount(1);
  await selectWorkspaceOption(page, 'Project', fixtures.project.name);
  await second.click();
  const dialog = page.getByTestId('task-panel');
  await expect(
    dialog.getByText(fixtures.agent.name, { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: new RegExp(fixtures.a.title) }),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: new RegExp(fixtures.a.title) })
    .click();
  await expect(
    page
      .getByTestId('task-panel')
      .getByRole('heading', { name: fixtures.a.title }),
  ).toBeVisible();
});

test('creates an explicitly owned task with a project and prerequisites', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  const dialog = page.getByTestId('task-panel');
  await dialog
    .getByRole('textbox', { name: /^Title/ })
    .fill(WORKSPACE_PREFIX + 'new task');
  await expect(
    dialog.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled();
  await selectWorkspaceOption(dialog, 'Responsible party', fixtures.agent.name);
  await selectWorkspaceOption(dialog, 'Project', fixtures.project.name);
  await dialog
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('A specific deliverable.');
  await dialog
    .getByRole('checkbox', { name: new RegExp(fixtures.a.title) })
    .press('Space');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('button', {
      name: new RegExp(WORKSPACE_PREFIX + 'new task'),
    }),
  ).toBeVisible();
  const saved = await workspaceDb.task.findFirstOrThrow({
    where: { title: WORKSPACE_PREFIX + 'new task' },
    include: { dependencies: true },
  });
  expect(saved.assigneeId).toBe(fixtures.agent.id);
  expect(saved.projectId).toBe(fixtures.project.id);
  expect(saved.dependencies.map((edge) => edge.dependsOnId)).toEqual([
    fixtures.a.id,
  ]);
});

test('polls external changes and preserves an open draft while detecting stale edits', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page.clock.install();
  await page
    .getByRole('button', { name: new RegExp(fixtures.b.title) })
    .click();
  const dialog = page.getByTestId('task-panel');
  await dialog.getByRole('button', { name: 'Edit', exact: true }).click();
  await dialog
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('Unsaved draft stays here.');
  await workspaceDb.task.update({
    where: { id: fixtures.b.id },
    data: { description: 'Changed externally' },
  });
  const poll = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/workspace',
  );
  await page.clock.fastForward(16_000);
  await poll;
  await expect(
    dialog.getByRole('textbox', { name: 'Description', exact: true }),
  ).toHaveValue('Unsaved draft stays here.');
  await expect(
    dialog.getByText(
      'This task changed while you were editing. Reopen it to load the latest version.',
    ),
  ).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled();
});

test('retains a usable graph after a polling failure and recovers manually', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page.route('**/api/workspace', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Could not refresh');
  await expect(
    page.getByRole('button', { name: new RegExp(fixtures.a.title) }),
  ).toBeVisible();
  await page.unroute('**/api/workspace');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(
    page.getByText('Could not refresh. Showing the last saved data.'),
  ).toHaveCount(0);
});

/** Membership updates must not discard a user's chosen graph pan and zoom. */
test('preserves the camera when polling adds and removes tasks', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page.clock.install();
  const world = page.locator('.graph-world');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const viewport = await page.locator('.graph-viewport').boundingBox();
  await page.mouse.move(viewport!.x + 10, viewport!.y + 10);
  await page.mouse.down();
  await page.mouse.move(viewport!.x + 60, viewport!.y + 35);
  await page.mouse.up();
  const transform = await world.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  const added = await workspaceDb.task.create({
    data: {
      title: WORKSPACE_PREFIX + 'external addition',
      assigneeId: fixtures.agent.id,
      projectId: fixtures.project.id,
      statusId: 'todo',
      position: 50,
    },
  });
  const arrival = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/workspace',
  );
  await page.clock.fastForward(16_000);
  await arrival;
  await expect(page.locator(`#task-node-${added.id}`)).toHaveCount(1);
  await expect(world).toHaveCSS('transform', transform);
  await workspaceDb.task.delete({ where: { id: added.id } });
  const removal = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/workspace',
  );
  await page.clock.fastForward(16_000);
  await removal;
  await expect(page.locator(`#task-node-${added.id}`)).toHaveCount(0);
  await expect(world).toHaveCSS('transform', transform);
});

test('manages responsible parties, colors and projects dynamically', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page.getByRole('button', { name: 'Organize', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('button', { name: 'Add responsible party', exact: true })
    .click();
  await dialog
    .getByRole('textbox', { name: /^Name/ })
    .fill(WORKSPACE_PREFIX + 'new owner');
  await selectWorkspaceOption(dialog, 'Type', 'Agent');
  await dialog
    .getByRole('textbox', { name: 'Description and instructions' })
    .fill('Work from MCP.');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    dialog.getByText(WORKSPACE_PREFIX + 'new owner', { exact: true }),
  ).toBeVisible();
  expect(
    await workspaceDb.assignee.findUnique({
      where: { name: WORKSPACE_PREFIX + 'new owner' },
    }),
  ).toMatchObject({
    kind: 'AGENT',
    description: 'Work from MCP.',
    color: '#7297CA',
  });
  await dialog.getByRole('tab', { name: 'Projects', exact: true }).click();
  await dialog
    .getByRole('button', { name: 'Add project', exact: true })
    .click();
  await dialog
    .getByRole('textbox', { name: /^Name/ })
    .fill(WORKSPACE_PREFIX + 'new project');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    dialog.getByText(WORKSPACE_PREFIX + 'new project', { exact: true }),
  ).toBeVisible();
});

test('returns conditional snapshots only to authenticated sessions', async ({
  page,
  request,
}) => {
  const anonymous = await request.get('/api/workspace', { maxRedirects: 0 });
  expect([301, 302, 303, 307, 308, 401]).toContain(anonymous.status());
  await loginWorkspace(page);
  const first = await page.request.get('/api/workspace');
  expect(first.status()).toBe(200);
  const etag = first.headers().etag;
  expect(etag).toBeTruthy();
  const second = await page.request.get('/api/workspace', {
    headers: { 'If-None-Match': etag },
  });
  expect(second.status()).toBe(304);
  expect(await second.text()).toBe('');
});
