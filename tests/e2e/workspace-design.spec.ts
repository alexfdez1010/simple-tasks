import { expect, test } from '@playwright/test';
import {
  clearWorkspace,
  loginWorkspace,
  seedWorkspace,
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

/** Verifies the new project rail changes real graph scope and can restore the complete workspace. */
test('filters real tasks from the project navigation rail', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const other = await workspaceDb.task.create({
    data: {
      title: WORKSPACE_PREFIX + 'independent project',
      projectId: 'project-general',
      assigneeId: fixtures.person.id,
      statusId: 'todo',
      position: 0,
    },
  });
  await loginWorkspace(page);
  const unrelated = page.getByRole('button', { name: new RegExp(other.title) });
  await expect(unrelated).toBeAttached();
  const rail = page.locator('.workspace-projects');
  const project = rail.getByRole('button', {
    name: new RegExp(fixtures.project.name),
  });
  await project.click();
  await expect(project).toHaveAttribute('aria-pressed', 'true');
  await expect(unrelated).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: new RegExp(fixtures.a.title) }),
  ).toBeVisible();
  await rail.getByRole('button', { name: /^All projects/ }).click();
  await expect(unrelated).toBeAttached();
});

/** Keeps every named navigation target reachable when localized tablet controls need a second row. */
test('keeps Spanish navigation within a tablet viewport', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.context().addCookies([
    {
      name: 'simple-tasks-language',
      value: 'es',
      url: baseURL ?? 'http://localhost:3000',
    },
  ]);
  await page.goto('/login');
  await page
    .getByLabel('Contraseña')
    .fill(process.env.PASSWORD ?? 'test-password');
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Tareas', exact: true }),
  ).toBeVisible();
  for (const target of await page
    .locator('.workspace-navigation')
    .locator('a:visible,button:visible')
    .all()) {
    await expect(target).toBeInViewport();
    const bounds = await target.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(768);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

for (const colorScheme of ['light', 'dark'] as const) {
  /** Ensures reduced-motion users can select tasks immediately and read the inspector in both themes. */
  test(`keeps selection and inspector legible with reduced motion in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme });
    await loginWorkspace(page);
    const task = page.getByRole('button', {
      name: new RegExp(fixtures.a.title),
    });
    await task.click();
    const panel = page.getByTestId('task-panel');
    const heading = panel.getByRole('heading', { name: fixtures.a.title });
    await expect(heading).toBeFocused();
    await expect(task).toHaveAttribute('aria-pressed', 'true');
    await expect(panel).toHaveCSS('animation-name', 'none');
    await expect(task).toHaveCSS('animation-name', 'none');
    const contrast = await heading.evaluate((element) => {
      const panel = element.closest('aside')!;
      /** Converts an RGB browser color into WCAG relative luminance. */
      function luminance(color: string) {
        const values = color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((value) => {
            const channel = value / 255;
            return channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4;
          });
        return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
      }
      const foreground = luminance(getComputedStyle(element).color);
      const background = luminance(getComputedStyle(panel).backgroundColor);
      return (
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05)
      );
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    await heading.press('Escape');
    await expect(task).toBeFocused();
  });
}
