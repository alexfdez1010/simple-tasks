import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const PASSWORD = process.env.PASSWORD ?? 'dev-password';
const PRIORITY_PROPERTY = `Mobile Priority ${process.pid}`;
const TAGS_PROPERTY = `Mobile Tags ${process.pid}`;
const TASK_TITLE = `E2E Mobile Properties ${process.pid}`;

/** Authenticates the emulated Pixel browser and waits for the board. */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
}

/** Creates one selectable property through the mobile settings dialog. */
async function createProperty(
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
  await settings.getByRole('button', { exact: true, name: 'Done' }).click();
  await expect(settings).toBeHidden();
}

/** Opens a named task property trigger and selects one option. */
async function selectOption(
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

/** Deletes the last property definition through its confirmed UI action. */
async function deleteLastProperty(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Settings/ }).click();
  const settings = page.getByRole('dialog', { name: /^Settings/ });
  await expect(settings).toBeVisible();
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

test.describe('mobile configurable properties', () => {
  /** Proves Pixel 7 users can configure, populate, edit, and read select values. */
  test('manages select and multi-select values', async ({ page }) => {
    await login(page);
    await createProperty(page, PRIORITY_PROPERTY, 'Select', [
      'Urgent',
      'Normal',
    ]);
    await createProperty(page, TAGS_PROPERTY, 'Multi-select', [
      'Home',
      'Work',
      'Personal',
    ]);
    await page.getByRole('button', { name: 'Add task to Blocked' }).click();
    const createDialog = page.getByRole('dialog', {
      name: 'Create task in Blocked',
    });
    await createDialog.getByLabel('Title').fill(TASK_TITLE);
    await selectOption(page, createDialog, PRIORITY_PROPERTY, 'Urgent');
    await createDialog
      .getByRole('button', {
        name: new RegExp(`^(?!Clear ).*${TAGS_PROPERTY}`),
      })
      .click();
    await page.getByRole('option', { exact: true, name: 'Home' }).click();
    await page.getByRole('option', { exact: true, name: 'Work' }).click();
    await page.keyboard.press('Escape');
    const taskCreation = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await createDialog.getByRole('button', { name: 'Save' }).click();
    await taskCreation;

    const card = page.getByRole('article', { name: TASK_TITLE });
    await expect(card.getByText('Urgent', { exact: true })).toBeVisible();
    await expect(card.getByText('Home, Work')).toBeVisible();

    await page.getByRole('button', { name: `Edit ${TASK_TITLE}` }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit task' });
    await selectOption(page, editDialog, PRIORITY_PROPERTY, 'Normal');
    await editDialog
      .getByRole('button', {
        name: new RegExp(`^(?!Clear ).*${TAGS_PROPERTY}`),
      })
      .click();
    await page.getByRole('option', { exact: true, name: 'Personal' }).click();
    await page.keyboard.press('Escape');
    const taskUpdate = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await editDialog.getByRole('button', { name: 'Save' }).click();
    await taskUpdate;

    await expect(card.getByText('Normal', { exact: true })).toBeVisible();
    await expect(card.getByText('Home, Work, Personal')).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole('article', { name: TASK_TITLE })
        .getByText('Home, Work, Personal'),
    ).toBeVisible();

    await page.getByRole('button', { name: `Edit ${TASK_TITLE}` }).click();
    const deleteDialog = page.getByRole('dialog', { name: 'Edit task' });
    await deleteDialog.getByRole('button', { name: 'Delete' }).click();
    const confirmation = page.getByRole('alertdialog');
    const taskDeletion = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await confirmation.getByRole('button', { name: 'Delete task' }).click();
    await taskDeletion;
    await expect(deleteDialog).toHaveCount(0);
    await expect(page.getByRole('article', { name: TASK_TITLE })).toHaveCount(
      0,
    );

    await deleteLastProperty(page);
    await deleteLastProperty(page);
    await page.getByRole('button', { name: /^Settings/ }).click();
    const cleanup = page.getByRole('dialog', { name: /^Settings/ });
    await cleanup.getByRole('tab', { name: 'Properties' }).click();
    await expect(cleanup.getByText(PRIORITY_PROPERTY)).toHaveCount(0);
    await expect(cleanup.getByText(TAGS_PROPERTY)).toHaveCount(0);
  });
});
