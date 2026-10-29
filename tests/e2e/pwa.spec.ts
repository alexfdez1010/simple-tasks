import { expect, test } from '@playwright/test';

/** Proves install metadata, worker registration and offline navigation without storing authenticated app documents. */
test('provides an installable shell and a private-data-safe offline fallback', async ({
  page,
  context,
  request,
}) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
  });
  await page.goto('/login');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/icons/apple-touch-icon.png',
  );
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? ''),
    )
    .toContain('/sw.js');
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls = await Promise.all(
      names
        .filter((name) => name.startsWith('simple-tasks-public-'))
        .map(async (name) =>
          (await (await caches.open(name)).keys()).map(
            (entry) => new URL(entry.url).pathname,
          ),
        ),
    );
    return urls.flat();
  });
  expect(cached).toContain('/offline.html');
  expect(
    cached.every(
      (path) => path === '/offline.html' || path.startsWith('/icons/'),
    ),
  ).toBe(true);
  await context.setOffline(true);
  await page.goto('/statistics');
  await expect(
    page.getByRole('heading', { name: 'You are offline', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try again' })).toHaveAttribute(
    'href',
    /\/statistics$/,
  );
  expect(
    await page.evaluate(() =>
      fetch('/api/workspace').then(
        () => false,
        () => true,
      ),
    ),
  ).toBe(true);
  await context.setOffline(false);
  await page.getByRole('link', { name: 'Try again' }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fstatistics$/);
});
