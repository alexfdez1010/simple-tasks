import { expect, test, type Page } from '@playwright/test';

const LANGUAGE_COOKIE_NAME = 'simple-tasks-language';
const PASSWORD = 'test-password';

/** Authenticates through the English-default password gateway. */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
}

test.describe('language preference', () => {
  /** Proves Settings changes the full interface and persists the selection. */
  test('switches to Spanish and back to English', async ({ context, page }) => {
    await login(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('button', { name: /Settings/ }).click();
    const englishSettings = page.getByRole('dialog', { name: /Settings/ });
    await englishSettings.getByRole('tab', { name: 'Language' }).click();
    await englishSettings.getByText('Spanish', { exact: true }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { name: 'Tareas' })).toBeVisible();
    const spanishSettings = page.getByRole('dialog', { name: /Ajustes/ });
    await expect(spanishSettings).toBeVisible();
    await expect(
      spanishSettings.getByRole('radio', { name: 'Español' }),
    ).toBeChecked();

    const spanishCookie = (await context.cookies()).find(
      (cookie) => cookie.name === LANGUAGE_COOKIE_NAME,
    );
    expect(spanishCookie?.value).toBe('es');
    expect(spanishCookie?.httpOnly).toBe(true);
    expect(spanishCookie?.sameSite).toBe('Lax');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { name: 'Tareas' })).toBeVisible();

    await page.getByRole('button', { name: /Ajustes/ }).click();
    const persistedSettings = page.getByRole('dialog', { name: /Ajustes/ });
    await persistedSettings.getByRole('tab', { name: 'Idioma' }).click();
    await persistedSettings.getByText('Inglés', { exact: true }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: /Settings/ })).toBeVisible();
  });

  /** Proves forged values cannot bypass the English fallback contract. */
  test('falls back to English for an unsupported cookie', async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: LANGUAGE_COOKIE_NAME,
        value: 'fr',
        url: 'http://localhost:3000',
      },
    ]);

    await page.goto('/login');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(
      page.getByRole('heading', { name: 'Your board' }),
    ).toBeVisible();
  });
});
