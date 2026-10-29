import { expect, test } from '@playwright/test';
import { selectWorkspaceOption } from './workspace-fixtures';
import {
  clearWebhookFixtures,
  fixtureSigningSecret,
  seedBlockedWebhook,
  webhookTestDb,
} from './webhook-fixtures';

/** Exercises owner setup, actual failure reporting, pause and secret reveal without an external receiver. */
test('manages a single webhook and reports the test result', async ({
  page,
}) => {
  await clearWebhookFixtures();
  await page.goto('/login');
  await page
    .getByLabel('Password')
    .fill(process.env.PASSWORD ?? 'test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('link', { name: 'Connections', exact: true }).click();
  try {
    const section = page.getByRole('region', {
      name: 'Task webhook',
      exact: true,
    });
    await section
      .getByRole('textbox', { name: /Destination URL/ })
      .fill('https://127.0.0.1/events');
    await section
      .getByRole('button', { name: 'Save webhook', exact: true })
      .click();
    await expect(section.getByRole('alert')).toContainText('Could not save');
    await expect(
      section.getByRole('textbox', { name: /Destination URL/ }),
    ).toHaveValue('https://127.0.0.1/events');
    expect(await webhookTestDb.webhookEndpoint.count()).toBe(0);
    await seedBlockedWebhook();
    await page.reload();
    await page
      .getByRole('link', { name: 'Back to board', exact: true })
      .click();
    await page.getByRole('button', { name: 'New task', exact: true }).click();
    await page
      .getByRole('textbox', { name: /^Title/ })
      .fill('E2E Webhook task');
    const owner = await webhookTestDb.assignee.findUniqueOrThrow({
      where: { id: 'assignee-default' },
    });
    await selectWorkspaceOption(
      page.getByTestId('task-panel'),
      'Responsible party',
      owner.name,
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('button', { name: /^E2E Webhook task ·/ }),
    ).toBeVisible();
    await expect
      .poll(() =>
        webhookTestDb.webhookDelivery.count({
          where: { event: 'task.created' },
        }),
      )
      .toBe(1);
    await page.getByRole('link', { name: 'Connections', exact: true }).click();
    await expect(
      section.getByRole('region', { name: 'Recent deliveries', exact: true }),
    ).toContainText('Task created');
    await section
      .getByRole('button', { name: 'Show signing secret', exact: true })
      .click();
    await expect(
      section.getByRole('textbox', { name: 'Signing secret', exact: true }),
    ).toHaveValue(fixtureSigningSecret);
    await section
      .getByRole('button', { name: 'Hide signing secret', exact: true })
      .click();
    await expect(
      section.getByRole('textbox', { name: 'Signing secret', exact: true }),
    ).toHaveAttribute('type', 'password');
    await section
      .getByRole('button', { name: 'Send test', exact: true })
      .click();
    const history = section.getByRole('region', {
      name: 'Recent deliveries',
      exact: true,
    });
    await expect(history).toContainText('Test delivery');
    await expect(history).toContainText('No response');
    await expect(
      history.getByRole('button', { name: 'Retry', exact: true }).first(),
    ).toBeVisible();
    await section.getByText('Send task events', { exact: true }).click();
    await expect(
      section.getByRole('switch', { name: 'Send task events', exact: true }),
    ).not.toBeChecked();
    await section
      .getByRole('button', { name: 'Save webhook', exact: true })
      .click();
    await expect(
      section.getByRole('status').filter({ hasText: 'Webhook saved.' }),
    ).toBeVisible();
    await expect(history).toContainText('Cancelled');
    expect(await webhookTestDb.webhookEndpoint.count()).toBe(1);
    await section
      .getByRole('link', { name: 'Webhook documentation', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Task webhooks', exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel('curl')).toContainText(
      'https://tasks.alejandrofernandezcamello.me/api/webhooks/dispatch',
    );
    await expect(page.getByText('task.deleted', { exact: true })).toBeVisible();
  } finally {
    await clearWebhookFixtures();
    await webhookTestDb.task.deleteMany({
      where: { title: 'E2E Webhook task' },
    });
    await webhookTestDb.$disconnect();
  }
});

/** Confirms the independent scheduler route uses existing token permissions and never session redirects. */
test('protects dispatch and connection settings from anonymous callers', async ({
  request,
}) => {
  expect(
    (await request.get('/connections', { maxRedirects: 0 })).status(),
  ).toBe(307);
  expect((await request.post('/api/webhooks/dispatch')).status()).toBe(401);
  expect((await request.get('/webhook-docs')).status()).toBe(200);
});
