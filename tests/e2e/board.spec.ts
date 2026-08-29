import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const PASSWORD = process.env.PASSWORD ?? 'dev-password';

/** Authenticates a fresh browser context through the user-visible login form. */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
}

/** Deletes a task through its edit dialog and accepts the native confirmation. */
async function deleteTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: `Edit ${title}` }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit task' });
  page.once('dialog', async (confirmation) => confirmation.accept());
  const persistence = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/',
  );
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await persistence;
  await expect(page.getByRole('article', { name: title })).toHaveCount(0);
}

/** Drags a task by its accessible handle into a named Kanban region. */
async function dragTask(
  page: Page,
  title: string,
  targetStatus: string,
): Promise<void> {
  const handle = page.getByRole('button', { name: `Drag ${title}` });
  const targetList = page
    .getByRole('region', { name: targetStatus })
    .getByRole('list');
  await handle.dragTo(targetList);
}

/** Verifies a card exposes dragging and editing without a state selector. */
async function expectDragOnlyCard(card: Locator): Promise<void> {
  await expect(card.getByRole('button', { name: /Move to/ })).toHaveCount(0);
  await expect(card.getByRole('combobox')).toHaveCount(0);
  await expect(card.getByRole('button', { name: /^Drag / })).toBeVisible();
}

/** Moves a task horizontally with dnd-kit's documented keyboard contract. */
async function keyboardDragTask(
  page: Page,
  title: string,
  targetStatus: string,
): Promise<void> {
  const card = page.getByRole('article', { name: title });
  const handle = card.getByRole('button', { name: `Drag ${title}` });
  const target = page.getByRole('region', { name: targetStatus });

  await handle.evaluate((element) =>
    element.scrollIntoView({ block: 'center', inline: 'center' }),
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await handle.focus();
  await expect(handle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(card).toHaveClass(/is-dragging/);
  const movedCard = target.getByRole('article', { name: title });
  for (
    let keyPresses = 0;
    keyPresses < 60 && (await movedCard.count()) === 0;
    keyPresses += 1
  ) {
    await page.keyboard.press('ArrowRight');
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
  }
  await expect(movedCard).toBeVisible();
  await page.keyboard.press('Space');
}

test.describe('desktop Kanban board', () => {
  /** Proves Markdown can be previewed, persisted, rendered, and edited safely. */
  test('creates and edits a task with Markdown', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'New task' }).click();

    const createDialog = page.getByRole('dialog', { name: 'Create task' });
    await createDialog.getByLabel('Title').fill('E2E Markdown');
    await createDialog
      .getByRole('textbox', { exact: true, name: 'Description' })
      .fill('**Important**\n\n- one\n- two\n\n[Guide](https://example.com)');
    await createDialog.getByLabel('Due date').fill('2026-09-05');
    await createDialog.getByRole('button', { name: 'Preview' }).click();
    await expect(createDialog.getByText('Important')).toBeVisible();
    await expect(createDialog.getByRole('listitem')).toHaveCount(2);
    await expect(
      createDialog.getByRole('link', { name: 'Guide' }),
    ).toHaveAttribute('rel', 'noopener noreferrer');
    await createDialog.getByRole('button', { name: 'Save' }).click();

    const created = page.getByRole('article', { name: 'E2E Markdown' });
    await expect(created).toBeVisible();
    await expect(created.getByText('Important')).toBeVisible();
    await expect(created.getByText('Due Sep 5, 2026')).toBeVisible();

    await page.getByRole('button', { name: 'Edit E2E Markdown' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit task' });
    await editDialog.getByLabel('Title').fill('E2E Markdown edited');
    await editDialog.getByRole('button', { name: 'Write' }).click();
    await editDialog
      .getByRole('textbox', { exact: true, name: 'Description' })
      .fill('## Result\n\nFinal text');
    await editDialog.getByRole('button', { name: 'Save' }).click();

    const edited = page.getByRole('article', { name: 'E2E Markdown edited' });
    await expect(edited).toBeVisible();
    await expect(edited.getByRole('heading', { name: 'Result' })).toBeVisible();
    await deleteTask(page, 'E2E Markdown edited');
  });

  /** Proves configurable terminal color reaches the rendered Kanban column. */
  test('configures a colored terminal status', async ({ page }, testInfo) => {
    const statusName = `E2E Archived ${process.pid}-${testInfo.repeatEachIndex}`;
    await login(page);
    await page.getByRole('button', { name: /^Settings/ }).click();

    const settings = page.getByRole('dialog', { name: /^Settings/ });
    await settings.getByRole('tab', { name: 'Statuses' }).click();
    await settings.getByRole('button', { name: 'Add status' }).click();
    await settings.getByLabel('Name').fill(statusName);
    await settings.getByLabel('Color').fill('#A855F7');
    await settings.getByText('Terminal status', { exact: true }).click();
    const creation = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await settings.getByRole('button', { name: 'Create status' }).click();
    await creation;
    await expect(settings).toHaveCount(0);

    const column = page.getByRole('region', { name: statusName });
    await expect(column).toBeVisible();
    await expect(column).toHaveCSS('--status-color', '#A855F7');
    await expect(column.getByText('Latest 20 tasks')).toBeVisible();

    await page.getByRole('button', { name: /^Settings/ }).click();
    const reopened = page.getByRole('dialog', { name: /^Settings/ });
    await reopened.getByRole('tab', { name: 'Statuses' }).click();
    await reopened.getByRole('button', { name: `Edit ${statusName}` }).click();
    await expect(reopened.getByLabel('Color')).toHaveValue('#A855F7');
    await expect(
      reopened.getByRole('checkbox', { name: 'Terminal status' }),
    ).toBeChecked();
    await reopened.getByRole('button', { name: 'Cancel' }).click();
    page.once('dialog', async (confirmation) => confirmation.accept());
    const deletion = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await reopened
      .getByRole('button', { name: `Delete status ${statusName}` })
      .last()
      .click();
    await deletion;
    await expect(reopened.getByText(statusName, { exact: true })).toHaveCount(
      0,
    );
  });

  /** Proves pointer dragging moves a task across columns and persists after reload. */
  test('moves a task by drag and drop', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'New task' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create task' });
    await dialog.getByLabel('Title').fill('E2E Drag');
    const creation = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await creation;

    await expectDragOnlyCard(page.getByRole('article', { name: 'E2E Drag' }));

    const persistence = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await dragTask(page, 'E2E Drag', 'In progress');
    await persistence;
    const target = page.getByRole('region', { name: 'In progress' });
    await expect(
      target.getByRole('article', { name: 'E2E Drag' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole('region', { name: 'In progress' })
        .getByRole('article', { name: 'E2E Drag' }),
    ).toBeVisible();
    await deleteTask(page, 'E2E Drag');
  });

  /** Proves keyboard users can move a task without a secondary status control. */
  test('moves a task with the drag handle keyboard contract', async ({
    page,
  }) => {
    await login(page);
    await page.getByRole('button', { name: 'New task' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create task' });
    await dialog.getByLabel('Title').fill('E2E Keyboard Drag');
    const creation = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await creation;

    const card = page.getByRole('article', { name: 'E2E Keyboard Drag' });
    await expectDragOnlyCard(card);
    const persistence = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await keyboardDragTask(page, 'E2E Keyboard Drag', 'To do');
    await persistence;

    const target = page.getByRole('region', { name: 'To do' });
    await expect(
      target.getByRole('article', { name: 'E2E Keyboard Drag' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole('region', { name: 'To do' })
        .getByRole('article', { name: 'E2E Keyboard Drag' }),
    ).toBeVisible();
    await deleteTask(page, 'E2E Keyboard Drag');
  });
});
