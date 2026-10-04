import { expect, test, type Page } from '@playwright/test';

/** Creates an isolated task through the real board form and waits for persistence. */
async function createTask(
  page: Page,
  title: string,
  description = '',
): Promise<void> {
  await page.getByRole('button', { name: 'Add task to To do' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create task in To do' });
  await dialog.getByLabel('Title').fill(title);
  if (description)
    await dialog
      .getByRole('textbox', { name: 'Description', exact: true })
      .fill(description);
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('article', { name: title, exact: true }),
  ).toBeVisible();
}

/** Removes this test's task through the destructive confirmation flow. */
async function removeTask(page: Page, title: string): Promise<void> {
  await page
    .getByRole('button', { name: `Edit ${title}`, exact: true })
    .click();
  await page
    .getByRole('dialog', { name: 'Edit task' })
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete task', exact: true })
    .click();
  await expect(
    page.getByRole('article', { name: title, exact: true }),
  ).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page
    .getByLabel('Password')
    .fill(process.env.PASSWORD ?? 'test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Tasks', exact: true }),
  ).toBeVisible();
});

/** Proves long titles wrap, title-only cards have one inspection stop, and keyboard works. */
test('inspects an unbroken title without clipping or duplicate keyboard controls', async ({
  page,
}) => {
  const title = 'Accessible'.repeat(16);
  await createTask(page, title);
  try {
    const card = page.getByRole('article', { name: title, exact: true });
    const trigger = card.getByRole('button', {
      name: `Open details for ${title}`,
    });
    await expect(trigger).toHaveCount(1);
    await expect(card.getByRole('heading', { name: title })).toBeVisible();
    const geometry = await trigger.evaluate((element) => ({
      client: element.clientWidth,
      scroll: element.scrollWidth,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
    await trigger.focus();
    await page.keyboard.press('Space');
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  } finally {
    await removeTask(page, title);
  }
});

/** Proves clicking or keyboard-activating Markdown links never opens the inspector. */
test('keeps Markdown navigation independent of task inspection', async ({
  page,
}) => {
  const title = `Accessible link ${Date.now()}`;
  await createTask(
    page,
    title,
    'Read the [Guide](https://example.com) before editing.',
  );
  try {
    await page
      .context()
      .route('https://example.com/**', (route) =>
        route.fulfill({ body: 'Guide' }),
      );
    const card = page.getByRole('article', { name: title, exact: true });
    const link = card.getByRole('link', { name: 'Guide' });
    for (const input of ['pointer', 'keyboard']) {
      const popupPromise = page.waitForEvent('popup');
      if (input === 'pointer') await link.click();
      else {
        await link.focus();
        await page.keyboard.press('Enter');
      }
      const popup = await popupPromise;
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await popup.close();
    }
    await card
      .locator('.task-description-preview')
      .click({ position: { x: 5, y: 5 } });
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  } finally {
    await removeTask(page, title);
  }
});
