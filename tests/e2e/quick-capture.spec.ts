import { expect, test } from '@playwright/test';

/** Proves draft recovery, progressive details and click-based movement use the real persistence flow. */
test('captures, promotes, recovers and moves a task without dragging', async ({
  page,
}) => {
  await page.goto('/login');
  await page
    .getByLabel('Password')
    .fill(process.env.PASSWORD ?? 'test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const title = `Quick capture ${Date.now()}`;
  const column = page.getByRole('region', { name: 'To do', exact: true });
  await column.getByRole('button', { name: 'Add task to To do' }).click();
  const input = column.getByRole('textbox', { name: /^Title/ });
  await input.fill(title);
  await column.getByRole('button', { name: 'Add details' }).click();
  const create = page.getByRole('dialog', { name: 'Create task in To do' });
  await expect(create.getByLabel('Title')).toHaveValue(title);
  await create.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(input).toHaveValue(title);
  await page.route('**/', async (route) => {
    if (route.request().method() === 'POST') await route.abort('failed');
    else await route.continue();
  });
  await input.press('Enter');
  await expect(column.getByRole('alert')).toBeVisible();
  await expect(input).toHaveValue(title);
  await expect(
    page.getByRole('article', { name: title, exact: true }),
  ).toHaveCount(0);
  await page.unroute('**/');
  await input.press('Enter');
  const card = page.getByRole('article', { name: title, exact: true });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: `Open details for ${title}` }).click();
  const detail = page.getByRole('dialog', { name: title, exact: true });
  await detail.getByRole('button', { name: 'Edit', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Edit task' })
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('A retained description');
  await page
    .getByRole('dialog', { name: 'Edit task' })
    .getByRole('button', { name: 'Save', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await card.getByRole('button', { name: `Open details for ${title}` }).click();
  await expect(detail).toBeVisible();
  await expect(detail.getByText('A retained description')).toBeVisible();
  await detail.getByRole('button', { name: /Move to/ }).click();
  await page.getByRole('option', { name: 'Done', exact: true }).click();
  await detail.getByRole('button', { name: 'Move task', exact: true }).click();
  const done = page.getByRole('region', { name: 'Done', exact: true });
  await expect(
    done.getByRole('article', { name: title, exact: true }),
  ).toBeVisible();
  await page.reload();
  await done.getByRole('button', { name: `Open details for ${title}` }).click();
  await expect(
    page.getByRole('dialog').getByText('Completed', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await done.getByRole('button', { name: `Edit ${title}` }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete task', exact: true })
    .click();
  await expect(card).toHaveCount(0);
});
