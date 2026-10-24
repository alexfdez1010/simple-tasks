import { expect, test } from '@playwright/test';
import {
  clearWebhookFixtures,
  seedBlockedWebhook,
  webhookTestDb,
} from './webhook-fixtures';

/** Proves Spanish dark webhook controls, history and docs fit a narrow touch viewport. */
test('uses webhook settings and diagnostics at 320px in dark Spanish', async ({
  page,
}) => {
  await seedBlockedWebhook();
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.context().addCookies([
    {
      name: 'simple-tasks-language',
      value: 'es',
      url: 'http://localhost:3000',
    },
  ]);
  try {
    await page.goto('/login');
    await page
      .getByLabel('Contraseña')
      .fill(process.env.PASSWORD ?? 'test-password');
    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .tap();
    await page.getByRole('link', { name: 'Conexiones', exact: true }).tap();
    const section = page.getByRole('region', {
      name: 'Webhook de tareas',
      exact: true,
    });
    await expect(
      section.getByRole('textbox', { name: /URL de destino/ }),
    ).toHaveValue('https://127.0.0.1/events');
    for (const button of await section.getByRole('button').all()) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x + box.width).toBeLessThanOrEqual(320);
      }
    }
    await section
      .getByRole('button', { name: 'Enviar prueba', exact: true })
      .tap();
    await expect(
      section.getByRole('region', { name: 'Envíos recientes', exact: true }),
    ).toContainText('Sin respuesta');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    await section
      .getByRole('link', { name: 'Documentación del webhook', exact: true })
      .tap();
    await expect(
      page.getByRole('heading', { name: 'Webhooks de tareas', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  } finally {
    await clearWebhookFixtures();
    await webhookTestDb.$disconnect();
  }
});
