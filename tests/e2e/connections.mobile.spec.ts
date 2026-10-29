import { expect, test } from '@playwright/test';

for (const language of ['en', 'es'] as const) {
  /** Keeps both supported integration paths usable at 320px with no retired webhook controls. */
  test(`uses the simplified Connections page on mobile in ${language}`, async ({
    page,
  }) => {
    const spanish = language === 'es';
    await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme: spanish ? 'dark' : 'light' });
    await page.context().addCookies([
      {
        name: 'simple-tasks-language',
        value: language,
        url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
      },
    ]);
    await page.goto('/login');
    await page
      .getByLabel(spanish ? 'Contraseña' : 'Password')
      .fill(process.env.PASSWORD ?? 'test-password');
    await page
      .getByRole('button', {
        name: spanish ? 'Iniciar sesión' : 'Sign in',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('heading', {
        name: spanish ? 'Tareas' : 'Tasks',
        exact: true,
      }),
    ).toBeVisible();
    await page.goto('/connections');
    await expect(
      page.getByRole('heading', {
        name: spanish ? 'Conexiones' : 'Connections',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: spanish ? 'Configurar un agente' : 'Set up an agent',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: spanish ? 'Gestionar acceso a la API' : 'Manage API access',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(/webhook/i)).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    for (const link of await page.getByRole('link').all()) {
      const box = await link.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
}
