import { expect, test } from '@playwright/test';

for (const width of [320, 390])
  for (const language of ['en', 'es'] as const) {
    /** Proves the minimal graph header and task capture remain reachable without page overflow. */
    test(`graph management at ${width}px in ${language}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
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
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
      for (const control of await page
        .locator('.workspace-header')
        .locator('a:visible,button:visible')
        .all()) {
        const box = await control.boundingBox();
        if (!box) continue;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      await page
        .getByRole('button', {
          name: language === 'es' ? 'Nueva tarea' : 'New task',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('dialog').getByRole('textbox', {
          name: language === 'es' ? /^Título/ : /^Title/,
        }),
      ).toBeFocused();
    });
  }
