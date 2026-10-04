import { expect, test } from '@playwright/test';

const PASSWORD = process.env.PASSWORD ?? 'dev-password';
const FORMATS = ['Compact', 'Automatic', 'Wide', 'Full width'] as const;

for (const format of FORMATS) {
  /**
   * Uses a real persisted widget to verify exact localized values fit its card.
   * DOM-only value substitution stresses layout without creating task fixtures;
   * the statistic is deleted even when a layout assertion fails.
   */
  test(`${format} KPI keeps large localized values inside its card`, async ({
    page,
  }) => {
    const name = `E2E KPI layout ${format} ${Date.now()}`;
    await page.goto('/login');
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('link', { name: 'Statistics' }).click();
    await page.getByRole('button', { name: 'Add statistic' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create statistic' });
    await dialog.getByLabel('Name').fill(name);
    await dialog.getByText(format, { exact: true }).click();
    await dialog.getByRole('button', { name: 'Add to canvas' }).click();
    const widget = page.locator('.statistics-widget').filter({
      has: page.getByRole('heading', { name, exact: true }),
    });
    await expect(widget).toBeVisible();

    try {
      await page.evaluate(() => document.fonts.ready);
      for (const width of [900, 320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const locale of ['en-US', 'es-ES']) {
          await page.emulateMedia({
            colorScheme: locale === 'en-US' ? 'light' : 'dark',
          });
          const value = new Intl.NumberFormat(locale).format(9876543210123.45);
          const metric = widget.locator('.statistics-metric-value');
          await metric.evaluate((element, text) => {
            element.textContent = text;
          }, value);
          await expect(metric).toHaveText(value);
          const layout = await metric.evaluate((element) => {
            const content = element.parentElement!;
            const bounds = content.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(element);
            const style = getComputedStyle(element);
            return {
              fits: Array.from(range.getClientRects()).every(
                (line) =>
                  line.left >= bounds.left - 1 &&
                  line.right <= bounds.right + 1,
              ),
              overflows: content.scrollWidth > content.clientWidth,
              fontSize: Number.parseFloat(style.fontSize),
              tracking: Number.parseFloat(style.letterSpacing),
              rootFontSize: Number.parseFloat(
                getComputedStyle(document.documentElement).fontSize,
              ),
            };
          });
          const context = `${format}, ${width}px, ${locale}`;
          expect(layout.fits, context).toBe(true);
          expect(layout.overflows, context).toBe(false);
          expect(layout.fontSize, context).toBeGreaterThanOrEqual(
            2 * layout.rootFontSize,
          );
          expect(layout.fontSize, context).toBeLessThanOrEqual(
            6 * layout.rootFontSize,
          );
          expect(
            layout.tracking / layout.fontSize,
            context,
          ).toBeGreaterThanOrEqual(-0.0401);
        }
      }
    } finally {
      await page.getByRole('button', { name: `Delete: ${name}` }).click();
      const deleteDialog = page.getByRole('dialog', {
        name: 'Delete statistic',
      });
      await deleteDialog
        .getByRole('button', { name: 'Delete', exact: true })
        .click();
      await expect(widget).toHaveCount(0);
    }
  });
}
