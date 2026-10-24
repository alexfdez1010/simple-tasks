import { expect, test } from '@playwright/test';

for (const width of [320, 390]) {
  for (const language of ['en', 'es'] as const) {
    /** Proves narrow localized controls remain reachable and a tap jumps to the desired column. */
    test(`phone header at ${width}px in ${language}`, async ({ page }) => {
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
      await expect(page.locator('.board-toolbar-wrap')).toHaveCSS(
        'position',
        'sticky',
      );
      for (const control of await page
        .locator('.board-toolbar')
        .locator('a:visible, button:visible')
        .all()) {
        const box = await control.boundingBox();
        if (!box) continue;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
      const selector = page.getByRole('button', {
        name: /Go to column|Ir a la columna/,
      });
      await selector.tap();
      await page
        .getByRole('option', { name: 'In progress · 0', exact: true })
        .tap();
      await expect(selector).toContainText('In progress');
      const column = page.getByRole('region', {
        name: 'In progress',
        exact: true,
      });
      const box = await column.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      await page
        .getByRole('button', {
          name: language === 'es' ? 'Nueva tarea' : 'New task',
          exact: true,
        })
        .tap();
      await expect(
        column.getByRole('textbox', {
          name: language === 'es' ? /^Título/ : /^Title/,
        }),
      ).toBeFocused();
      await column
        .getByRole('button', {
          name: language === 'es' ? 'Cancelar' : 'Cancel',
          exact: true,
        })
        .tap();
      const board = page.locator('.kanban-board');
      await board.evaluate((element) => {
        element.scrollLeft = 0;
      });
      await expect(selector).toContainText('Blocked');
    });
  }
}
