import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

/** Exercises owner management and the actual REST server, without exposing a saved token again. */
test('creates scoped tokens, performs REST operations and revokes access', async ({
  page,
  request,
}) => {
  await page.goto('/login');
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.PASSWORD ?? 'dev-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('link', { name: 'Connections', exact: true }).click();
  await page
    .getByRole('link', { name: 'Manage API access', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'API access' }),
  ).toBeVisible();
  await mkdir('.impeccable/review', { recursive: true });
  expect(
    (await page
      .getByRole('button', { name: 'Create token', exact: true })
      .boundingBox())!.height,
  ).toBeGreaterThanOrEqual(44);
  const suffix = `${Date.now()}`;
  const readName = `E2E API read ${suffix}`,
    writeName = `E2E API automation ${suffix}`;
  await page.getByLabel('Token name', { exact: true }).fill(readName);
  await page.getByRole('button', { name: 'Create token', exact: true }).click();
  const secret = page.getByLabel('New API token', { exact: true });
  await expect(secret).toBeFocused();
  const readToken = await secret.inputValue();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({
    path: '.impeccable/review/secret-mobile-dark.png',
    fullPage: true,
    animations: 'disabled',
  });
  expect(
    (await page
      .getByRole('button', { name: 'Copy token', exact: true })
      .boundingBox())!.height,
  ).toBeGreaterThanOrEqual(44);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: 'light' });
  expect(readToken).toMatch(/^st_/);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy token', exact: true }).click();
  await expect(page.getByText('Token copied', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    readToken,
  );
  const readHeaders = { Authorization: `Bearer ${readToken}` };
  expect(
    (
      await request.get('/api/v1/tasks?limit=1', { headers: readHeaders })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post('/api/v1/tasks', {
        headers: readHeaders,
        data: { title: 'Forbidden' },
      })
    ).status(),
  ).toBe(403);
  await page
    .getByRole('button', { name: 'I have saved it', exact: true })
    .click();
  await page.reload();
  await expect(secret).toHaveCount(0);
  expect(await page.content()).not.toContain(readToken);
  await page.getByLabel('Token name', { exact: true }).fill(writeName);
  await page.getByRole('button', { name: /Permissions/ }).click();
  await page
    .getByRole('option', { name: 'Read and write', exact: true })
    .click();
  await page.getByRole('button', { name: 'Create token', exact: true }).click();
  await expect(secret).toBeVisible();
  const writeToken = await secret.inputValue();
  const headers = { Authorization: `Bearer ${writeToken}` };
  await page
    .getByRole('button', { name: 'I have saved it', exact: true })
    .click();

  let statusId: string | undefined, taskId: string | undefined;
  try {
    const statusResponse = await request.post('/api/v1/statuses', {
      headers,
      data: { name: `E2E API ${suffix}`, color: '#334455', isTerminal: true },
    });
    expect(statusResponse.status()).toBe(201);
    statusId = (await statusResponse.json()).data.id;
    const create = await request.post('/api/v1/tasks', {
      headers,
      data: { title: 'Created through REST', statusId },
    });
    expect(create.status()).toBe(201);
    const { data: task } = await create.json();
    taskId = task.id;
    expect(task.completedAt).toBeTruthy();
    expect(task.propertyValues).toEqual([]);
    const list = await request.get(
      `/api/v1/tasks?statusId=${statusId}&scope=completed&limit=1`,
      { headers },
    );
    expect(await list.json()).toMatchObject({
      data: [{ id: taskId }],
      pagination: { limit: 1, hasMore: false, nextCursor: null },
    });
    expect(
      (
        await request.patch(`/api/v1/tasks/${taskId}`, {
          headers,
          data: { title: 'Updated through REST' },
        })
      ).status(),
    ).toBe(200);
    expect(
      (await request.get(`/api/v1/tasks/${taskId}`, { headers })).headers()[
        'cache-control'
      ],
    ).toBe('no-store');
    expect((await request.get('/api/v1/tasks')).status()).toBe(401);
    expect(
      (await request.get('/api/v1/statistics', { headers })).status(),
    ).toBe(404);
    expect((await request.get('/api/openapi')).status()).toBe(200);
    await page.reload();
    await mkdir('.impeccable/review', { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: '.impeccable/review/desktop.png',
      fullPage: true,
      animations: 'disabled',
    });
    await page.context().addCookies([
      {
        name: 'simple-tasks-language',
        value: 'es',
        url: 'http://localhost:3000',
      },
    ]);
    await page.reload();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByRole('heading', { name: 'Acceso a la API', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: '.impeccable/review/mobile.png',
      fullPage: true,
      animations: 'disabled',
    });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({
      path: '.impeccable/review/mobile-dark.png',
      fullPage: true,
      animations: 'disabled',
    });
    await page.goto('/api-docs');
    await expect(
      page.getByRole('heading', {
        name: 'Documentación de la API',
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByText('Consultar y filtrar todo el historial de tareas', {
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: '.impeccable/review/docs-mobile.png',
      fullPage: true,
      animations: 'disabled',
    });
  } finally {
    if (taskId) await request.delete(`/api/v1/tasks/${taskId}`, { headers });
    if (statusId)
      await request.delete(`/api/v1/statuses/${statusId}`, { headers });
    await page.context().addCookies([
      {
        name: 'simple-tasks-language',
        value: 'en',
        url: 'http://localhost:3000',
      },
    ]);
    await page.goto('/api-access');
    for (const name of [readName, writeName]) {
      await page
        .getByRole('button', { name: `Revoke: ${name}`, exact: true })
        .click();
      if (name === readName)
        await page.screenshot({
          path: '.impeccable/review/revoke-mobile-dark.png',
          fullPage: true,
          animations: 'disabled',
        });
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Revoke', exact: true })
        .click();
      await expect(page.getByRole('alertdialog')).toHaveCount(0);
    }
  }
  expect(
    (await request.get('/api/v1/tasks', { headers: readHeaders })).status(),
  ).toBe(401);
  expect((await request.get('/api/v1/tasks', { headers })).status()).toBe(401);
});

/** Proves public documentation is available while credential management still requires a session. */
test('exposes documentation without exposing token management', async ({
  page,
  request,
}) => {
  await page.goto('/api-access');
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/api-docs');
  await expect(
    page.getByRole('heading', { level: 1, name: 'API documentation' }),
  ).toBeVisible();
  const contract = await request.get('/api/openapi');
  const json = await contract.json();
  expect(json.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
  expect(json.paths['/tasks'].get.parameters).toEqual(
    expect.arrayContaining([expect.objectContaining({ name: 'limit' })]),
  );
});
