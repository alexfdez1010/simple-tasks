import { expect, test, type Page } from '@playwright/test';

const PASSWORD = process.env.PASSWORD ?? 'dev-password';

/**
 * Signs in in English, then loads the requested locale without changing data.
 * @param page - Isolated test browser; login errors fail its heading assertion.
 * @param language - Supported language cookie to set after authentication.
 * @returns Once the localized board and its fonts are ready.
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

/**
 * Checks phone toolbar geometry, visible names, and frequent touch targets.
 * @param page - Loaded board; missing elements fail locator assertions.
 * @param language - Chooses the expected heading and action names.
 * @returns After all controls fit and the three header rows do not overlap.
 * @remarks Reads layout only; permits navigation to wrap onto additional rows.
 */
async function expectPhoneHeader(
  page: Page,
  language: 'en' | 'es',
): Promise<void> {
  const heading = page.getByRole('heading', {
    name: language === 'es' ? 'Tareas' : 'Tasks',
    exact: true,
  });
  await expect(heading).toBeVisible();
  const actions = page.locator('.board-actions');
  await expect(
    actions.getByRole('link', {
      name: language === 'es' ? 'IA' : 'AI',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    actions.getByRole('link', {
      name: language === 'es' ? 'Estadísticas' : 'Statistics',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    actions.getByRole('button', {
      name: language === 'es' ? /Ajustes/ : /Settings/,
    }),
  ).toBeVisible();
  await expect(
    actions.getByRole('button', {
      name: language === 'es' ? 'Cerrar sesión' : 'Sign out',
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    actions.getByText(language === 'es' ? 'Ajustes' : 'Settings', {
      exact: true,
    }),
  ).toBeVisible();

  const toolbar = page.locator('.board-toolbar');
  const toolbarBox = await toolbar.boundingBox();
  const headingBox = await heading.boundingBox();
  const actionsBox = await actions.boundingBox();
  const summaryBox = await page.locator('.board-metrics').boundingBox();
  expect(toolbarBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(summaryBox).not.toBeNull();
  if (!toolbarBox || !headingBox || !actionsBox || !summaryBox) return;
  expect(headingBox.y + headingBox.height).toBeLessThanOrEqual(actionsBox.y);
  expect(actionsBox.y + actionsBox.height).toBeLessThanOrEqual(summaryBox.y);
  expect(toolbarBox.x).toBeGreaterThanOrEqual(0);
  expect(toolbarBox.x + toolbarBox.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  for (const container of [toolbar, actions, page.locator('.board-metrics')]) {
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
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    if (!box) continue;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(toolbarBox.x);
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
}

for (const width of [320, 390]) {
  for (const language of ['en', 'es'] as const) {
    /** Verifies localized navigation fits small phones and supports keyboard bypass. */
    test(`phone header at ${width}px in ${language}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await openBoard(page, language);
      await expectPhoneHeader(page, language);

      // Stress the exact summary values without creating a large database fixture.
      await page.locator('.board-metric-copy').evaluate((element) => {
        element.textContent =
          '999.999.999.999 activas · 999.999.999.999 terminadas';
      });
      await page.locator('.board-visible-count').evaluate((element) => {
        element.textContent = '999.999.999.999 visibles';
      });
      await expectPhoneHeader(page, language);

      const skip = page.getByRole('link', {
        name:
          language === 'es'
            ? 'Saltar al tablero de tareas'
            : 'Skip to task board',
      });
      await skip.focus();
      await expect(skip).toBeInViewport();
      await skip.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
    });
  }
}
