import { expect, test } from '@playwright/test';

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
      const toolbar = page.locator('.board-toolbar');
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
      await expect(page.getByRole('progressbar')).toHaveCount(0);
      await expect(
        page.getByRole('link', {
          name: language === 'es' ? 'Conexiones' : 'Connections',
          exact: true,
        }),
      ).toBeVisible();
      const skip = page.getByRole('link', {
        name:
          language === 'es'
            ? 'Saltar al tablero de tareas'
            : 'Skip to task board',
      });
      await skip.focus();
      await skip.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
    });
  }
}
