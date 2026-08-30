import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const PASSWORD = process.env.PASSWORD ?? 'dev-password';
const PRIORITY_PROPERTY = `E2E Priority ${process.pid}`;
const UPDATED_PRIORITY_PROPERTY = `${PRIORITY_PROPERTY} updated`;
const AREAS_PROPERTY = `E2E Areas ${process.pid}`;
const TASK_TITLE = `E2E Properties ${process.pid}`;

/** Authenticates a desktop browser and waits for the current board. */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
}

/** Creates one SELECT-like definition through the accessible settings form. */
async function createSelectableProperty(
  page: Page,
  name: string,
  type: 'Select' | 'Multi-select',
  options: string[],
): Promise<void> {
  await page.getByRole('button', { name: /^Settings/ }).click();
  const settings = page.getByRole('dialog', { name: /^Settings/ });
  await settings.getByRole('tab', { name: 'Properties' }).click();
  await settings.getByRole('button', { name: 'Add property' }).click();
  await settings.getByRole('textbox', { name: 'Name' }).fill(name);
  await settings.getByRole('button', { name: /Type/ }).click();
  await page.getByRole('option', { exact: true, name: type }).click();
  for (const [index, option] of options.entries()) {
    await settings.getByRole('button', { name: 'Add option' }).click();
    await settings
      .getByRole('textbox', { name: `Option ${index + 1}` })
      .fill(option);
  }
  const persistence = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/',
  );
  await settings.getByRole('button', { name: 'Create property' }).click();
  await persistence;
  await expect(settings).toBeVisible();
  await expect(settings.getByText(name, { exact: true })).toBeVisible();
  await settings.getByRole('button', { exact: true, name: 'Done' }).click();
  await expect(settings).toBeHidden();
}

/** Opens a task property Select and chooses one visible option. */
async function choosePropertyOption(
  page: Page,
  dialog: Locator,
  propertyName: string,
  option: string,
): Promise<void> {
  await dialog
    .getByRole('button', {
      name: new RegExp(`^(?!Clear ).*${propertyName}`),
    })
    .click();
  await page.getByRole('option', { exact: true, name: option }).click();
}

/** Deletes a task and waits for its server action to finish. */
async function deleteTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: `Edit ${title}` }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit task' });
  await dialog.getByRole('button', { name: 'Delete' }).click();
  const confirmation = page.getByRole('alertdialog');
  const persistence = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/',
  );
  await confirmation.getByRole('button', { name: 'Delete task' }).click();
  await persistence;
  await expect(page.getByRole('article', { name: title })).toHaveCount(0);
}

/** Deletes the last configured property and waits for persistence. */
async function deleteLastProperty(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Settings/ }).click();
  const settings = page.getByRole('dialog', { name: /^Settings/ });
  await settings.getByRole('tab', { name: 'Properties' }).click();
  await settings
    .getByRole('button', { name: 'Delete property' })
    .last()
    .click();
  const confirmation = page.getByRole('alertdialog');
  const persistence = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/',
  );
  await confirmation.getByRole('button', { name: 'Delete property' }).click();
  await persistence;
  await expect(settings).toBeVisible();
  await settings.getByRole('button', { exact: true, name: 'Done' }).click();
  await expect(settings).toBeHidden();
}

test.describe('desktop configurable properties', () => {
  /** Proves SELECT and MULTI_SELECT definitions drive editable, visible task values. */
  test('creates definitions and assigns and edits task values', async ({
    page,
  }) => {
    await login(page);
    await createSelectableProperty(page, PRIORITY_PROPERTY, 'Select', [
      'High',
      'Medium',
      'Low',
    ]);
    await createSelectableProperty(page, AREAS_PROPERTY, 'Multi-select', [
      'Frontend',
      'Backend',
      'Infra',
    ]);

    await page.getByRole('button', { name: /^Settings/ }).click();
    const settings = page.getByRole('dialog', { name: /^Settings/ });
    await settings.getByRole('tab', { name: 'Properties' }).click();
    await settings
      .getByRole('button', { name: `Edit ${PRIORITY_PROPERTY}` })
      .click();
    await settings
      .getByRole('textbox', { name: 'Name' })
      .fill(UPDATED_PRIORITY_PROPERTY);
    const propertyUpdate = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await settings.getByRole('button', { name: 'Save' }).click();
    await propertyUpdate;
    await expect(settings).toBeVisible();
    await expect(
      settings.getByText(UPDATED_PRIORITY_PROPERTY, { exact: true }),
    ).toBeVisible();
    await settings.getByRole('button', { exact: true, name: 'Done' }).click();

    await page.getByRole('button', { name: 'Add task to Blocked' }).click();
    const createDialog = page.getByRole('dialog', {
      name: 'Create task in Blocked',
    });
    await createDialog.getByLabel('Title').fill(TASK_TITLE);
    await choosePropertyOption(
      page,
      createDialog,
      UPDATED_PRIORITY_PROPERTY,
      'High',
    );
    await createDialog
      .getByRole('button', {
        name: new RegExp(`^(?!Clear ).*${AREAS_PROPERTY}`),
      })
      .click();
    await page.getByRole('option', { exact: true, name: 'Frontend' }).click();
    await page.getByRole('option', { exact: true, name: 'Infra' }).click();
    await page.keyboard.press('Escape');
    const taskCreation = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await createDialog.getByRole('button', { name: 'Save' }).click();
    await taskCreation;

    const card = page.getByRole('article', { name: TASK_TITLE });
    await expect(card.getByText(UPDATED_PRIORITY_PROPERTY)).toBeVisible();
    await expect(card.getByText('High', { exact: true })).toBeVisible();
    await expect(card.getByText(AREAS_PROPERTY)).toBeVisible();
    await expect(card.getByText('Frontend, Infra')).toBeVisible();

    await page.getByRole('button', { name: `Edit ${TASK_TITLE}` }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit task' });
    await choosePropertyOption(
      page,
      editDialog,
      UPDATED_PRIORITY_PROPERTY,
      'Low',
    );
    await editDialog
      .getByRole('button', {
        name: new RegExp(`^(?!Clear ).*${AREAS_PROPERTY}`),
      })
      .click();
    await page.getByRole('option', { exact: true, name: 'Backend' }).click();
    await page.keyboard.press('Escape');
    const taskUpdate = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await editDialog.getByRole('button', { name: 'Save' }).click();
    await taskUpdate;

    await expect(card.getByText('Low', { exact: true })).toBeVisible();
    await expect(card.getByText('Frontend, Infra, Backend')).toBeVisible();
    await page.reload();
    const persisted = page.getByRole('article', { name: TASK_TITLE });
    await expect(persisted.getByText('Low', { exact: true })).toBeVisible();
    await expect(persisted.getByText('Frontend, Infra, Backend')).toBeVisible();

    await deleteTask(page, TASK_TITLE);
    await deleteLastProperty(page);
    await deleteLastProperty(page);
    await page.getByRole('button', { name: /^Settings/ }).click();
    const cleanup = page.getByRole('dialog', { name: /^Settings/ });
    await cleanup.getByRole('tab', { name: 'Properties' }).click();
    await expect(cleanup.getByText(UPDATED_PRIORITY_PROPERTY)).toHaveCount(0);
    await expect(cleanup.getByText(AREAS_PROPERTY)).toHaveCount(0);
  });
});
