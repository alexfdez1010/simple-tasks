import { expect, test } from '@playwright/test';
import { loginWorkspace, workspaceDb } from './workspace-fixtures';

test.afterAll(async () => {
  await workspaceDb.$disconnect();
});

/** Exercises the shared phone shell and verifies example creation, editing and reset never reach server actions. */
test('creates and resets a local example through the phone workspace shell', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginWorkspace(page);
  const writes: string[] = [];
  const workspaceReads: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.method() !== 'HEAD')
      writes.push(request.url());
    if (new URL(request.url()).pathname === '/api/workspace')
      workspaceReads.push(request.url());
  });
  await page.goto('/design-preview');
  await expect(
    page.getByText('Datos de ejemplo. Los cambios no afectan a tus tareas.'),
  ).toBeVisible();
  const graphTasks = page.locator('.graph-node');
  await expect(graphTasks).toHaveCount(6);
  const create = page.getByRole('button', { name: 'New task', exact: true });
  await expect(create).toBeInViewport();
  await create.tap();
  const panel = page.getByRole('complementary', { name: 'Detalle de tarea' });
  await expect(
    panel.getByRole('textbox', { name: 'Título', exact: true }),
  ).toHaveValue('Nueva tarea de ejemplo');
  await panel
    .getByRole('textbox', { name: 'Título', exact: true })
    .fill('Mi ejemplo local');
  await panel
    .getByRole('textbox', { name: 'Descripción', exact: true })
    .fill('Un borrador que vive solo en esta vista.');
  await panel.getByRole('button', { name: 'Completar', exact: true }).tap();
  await expect(
    panel.getByRole('button', { name: 'Reabrir', exact: true }),
  ).toBeEnabled();
  await panel
    .getByRole('button', { name: 'Cerrar detalle', exact: true })
    .tap();
  await expect(graphTasks).toHaveCount(7);
  await page.getByRole('button', { name: 'Restablecer', exact: true }).tap();
  await expect(graphTasks).toHaveCount(6);
  await expect(
    page.getByRole('button', { name: /Mi ejemplo local/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  expect(writes).toEqual([]);
  expect(workspaceReads).toEqual([]);
});
