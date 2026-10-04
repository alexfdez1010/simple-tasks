import { expect, test, type Page } from '@playwright/test';

const PASSWORD = process.env.PASSWORD ?? 'dev-password';

/**
 * Authenticates and loads the requested language without writing board data.
 * @param page - Isolated browser; authentication failure rejects assertions.
 * @param language - Supported locale for the board header.
 * @returns Once the localized board and web fonts have loaded.
 */
async function openBoard(page: Page, language: 'en' | 'es'): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Tasks', exact: true }),
  ).toBeVisible();
  await page
    .context()
    .addCookies([
      { name: 'simple-tasks-language', value: language, url: page.url() },
    ]);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await page.evaluate(() => document.fonts.ready);
}

for (const width of [768, 900, 1440]) {
  for (const language of ['en', 'es'] as const) {
    /** Verifies tablet and wide-screen composition, targets, and keyboard bypass. */
    test(`board header at ${width}px in ${language}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1024 });
      await openBoard(page, language);
      const toolbar = page.locator('.board-toolbar');
      const actions = page.locator('.board-actions');
      const heading = page.getByRole('heading', {
        name: language === 'es' ? 'Tareas' : 'Tasks',
        exact: true,
      });
      await expect(heading).toBeVisible();
      const toolbarBox = await toolbar.boundingBox();
      const headingBox = await heading.boundingBox();
      const actionsBox = await actions.boundingBox();
      const summaryBox = await page.locator('.board-metrics').boundingBox();
      expect(toolbarBox).not.toBeNull();
      expect(headingBox).not.toBeNull();
      expect(actionsBox).not.toBeNull();
      expect(summaryBox).not.toBeNull();
      if (!toolbarBox || !headingBox || !actionsBox || !summaryBox) return;
      expect(headingBox.x + headingBox.width).toBeLessThanOrEqual(actionsBox.x);
      if (width < 1200) {
        expect(actionsBox.y + actionsBox.height).toBeLessThanOrEqual(
          summaryBox.y,
        );
      } else {
        expect(headingBox.x + headingBox.width).toBeLessThanOrEqual(
          summaryBox.x,
        );
        expect(summaryBox.x + summaryBox.width).toBeLessThanOrEqual(
          actionsBox.x,
        );
      }
      expect(toolbarBox.x).toBeGreaterThanOrEqual(0);
      expect(toolbarBox.x + toolbarBox.width).toBeLessThanOrEqual(width);
      for (const container of [
        toolbar,
        actions,
        page.locator('.board-metrics'),
      ]) {
        expect(
          await container.evaluate(
            (element) => element.scrollWidth - element.clientWidth,
          ),
        ).toBeLessThanOrEqual(1);
      }
      const controls = actions.locator('a, button');
      await expect(controls).toHaveCount(4);
      const boxes = [];
      for (const control of await controls.all()) {
        await expect(control).toBeVisible();
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        if (!box) continue;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x + box.width).toBeLessThanOrEqual(
          toolbarBox.x + toolbarBox.width,
        );
        for (const previous of boxes) {
          const overlaps =
            box.x < previous.x + previous.width &&
            previous.x < box.x + box.width &&
            box.y < previous.y + previous.height &&
            previous.y < box.y + box.height;
          expect(overlaps).toBe(false);
        }
        boxes.push(box);
      }
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
