import { expect, test } from '@playwright/test';
import { expectCenteredSelectText } from './select-alignment';

for (const width of [768, 900, 1440]) {
  for (const language of ['en', 'es'] as const) {
    /** Checks named navigation, primary creation, nonoverlapping controls and keyboard bypass. */
    test(`board header at ${width}px in ${language}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1024 });
      await page.context().addCookies([
        {
          name: 'simple-tasks-language',
          value: language,
          url: 'http://localhost:3000',
        },
      ]);
      await page.goto('/login');
      await page
        .getByLabel(language === 'es' ? 'Contraseña' : 'Password')
        .fill(process.env.PASSWORD ?? 'test-password');
      await page
        .getByRole('button', {
          name: language === 'es' ? 'Iniciar sesión' : 'Sign in',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('heading', {
          name: language === 'es' ? 'Tareas' : 'Tasks',
          exact: true,
        }),
      ).toBeVisible();
      await expectCenteredSelectText(page);
      const toolbar = page.locator('.workspace-header');
      for (const control of await toolbar
        .locator('a:visible, button:visible')
        .all()) {
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
      expect(
        await toolbar.evaluate(
          (element) => element.scrollWidth - element.clientWidth,
        ),
      ).toBeLessThanOrEqual(1);
      const filters = page.locator('.workspace-toolbar');
      const search = await filters.getByRole('textbox').boundingBox();
      const owner = await filters
        .locator('[data-slot="select-trigger"]')
        .first()
        .boundingBox();
      const interval = await filters
        .locator('.workspace-sync [data-slot="select-trigger"]')
        .boundingBox();
      const refresh = await filters
        .locator('.workspace-sync > button')
        .boundingBox();
      for (const control of [search, owner, interval, refresh]) {
        expect(control).not.toBeNull();
        expect(control!.height).toBe(44);
      }
      const completed = await filters
        .locator('.checkbox__content')
        .boundingBox();
      expect(completed).not.toBeNull();
      expect(
        Math.abs(
          completed!.y + completed!.height / 2 - search!.y - search!.height / 2,
        ),
      ).toBeLessThanOrEqual(1);
      expect(Math.abs(search!.y - owner!.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(interval!.y - refresh!.y)).toBeLessThanOrEqual(1);
      await expect(page.getByRole('progressbar')).toHaveCount(0);
      await expect(
        page.getByRole('link', {
          name: language === 'es' ? 'Conexiones' : 'Connections',
          exact: true,
        }),
      ).toBeVisible();
      const skip = page.getByRole('link', {
        name:
          language === 'es' ? 'Dependencias de tareas' : 'Task dependencies',
      });
      await skip.focus();
      await skip.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
    });
  }
}
