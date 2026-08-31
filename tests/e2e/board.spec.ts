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

/** Deletes a task through its edit and HeroUI confirmation dialogs. */
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

/** Drags a task by its accessible handle into a named Kanban region. */
async function dragTask(
  page: Page,
  title: string,
  targetStatus: string,
): Promise<void> {
  const card = page.getByRole('article', { name: title });
  const handle = page.getByRole('button', { name: `Drag ${title}` });
  const targetList = page
    .getByRole('region', { name: targetStatus })
    .getByRole('list', { name: `${targetStatus} tasks` });
  const sourceBox = await handle.boundingBox();
  const targetBox = await targetList.boundingBox();
  if (!sourceBox || !targetBox)
    throw new Error('Drag endpoints are not visible.');
  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + Math.min(targetBox.height / 2, 80);

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move(sourceX + 10, sourceY, { steps: 3 });
  await expect(card).toHaveClass(/is-dragging/);
  await page.mouse.move(targetX, targetY, { steps: 16 });
  await page.mouse.up();
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
    await page.getByRole('button', { name: 'Add task to To do' }).click();

    const createDialog = page.getByRole('dialog', {
      name: 'Create task in To do',
    });
    await createDialog.getByLabel('Title').fill('E2E Markdown');
    await createDialog
      .getByRole('textbox', { exact: true, name: 'Description' })
      .fill('**Important**\n\n- one\n- two\n\n[Guide](https://example.com)');
    const dueDate = createDialog.getByRole('group', { name: 'Due date' });
    await dueDate.getByRole('spinbutton').nth(0).fill('9');
    await dueDate.getByRole('spinbutton').nth(1).fill('5');
    await dueDate.getByRole('spinbutton').nth(2).fill('2026');
    await createDialog.getByRole('button', { name: 'Preview' }).click();
    await expect(createDialog.getByText('Important')).toBeVisible();
    await expect(createDialog.getByRole('listitem')).toHaveCount(2);
    await expect(
      createDialog.getByRole('link', { name: 'Guide' }),
    ).toHaveAttribute('rel', 'noopener noreferrer');
    await createDialog.getByRole('button', { name: 'Save' }).click();

    const created = page.getByRole('article', { name: 'E2E Markdown' });
    await expect(created).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: 'To do' })
        .getByRole('article', { name: 'E2E Markdown' }),
    ).toBeVisible();
    const statusRailColor = await created
      .locator('.task-card')
      .evaluate(
        (element) => getComputedStyle(element, '::before').backgroundColor,
      );
    expect(statusRailColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(statusRailColor).not.toBe('transparent');
    await expect(created.getByText('Important')).toBeVisible();
    await expect(created.getByText('Due Sep 5, 2026')).toBeVisible();

    await created.locator('.task-card').click();
    const detailDialog = page.getByRole('dialog', { name: 'E2E Markdown' });
    await expect(
      detailDialog.getByRole('heading', { name: 'Description' }),
    ).toBeVisible();
    await expect(
      detailDialog.getByRole('heading', { name: 'Properties' }),
    ).toBeVisible();
    await expect(detailDialog.getByText('Important')).toBeVisible();
    await detailDialog.getByRole('button', { name: 'Cancel' }).click();

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

  /** Proves a configured terminal transition fills the completion date. */
  test('creates a completion-date automation and runs it on transition', async ({
    page,
  }, testInfo) => {
    const automationName = `E2E Complete date ${process.pid}-${testInfo.repeatEachIndex}`;
    const taskTitle = `E2E Automation ${process.pid}-${testInfo.repeatEachIndex}`;
    await login(page);
    await page.getByRole('button', { name: /^Settings/ }).click();
    const settings = page.getByRole('dialog', { name: /^Settings/ });
    await settings.getByRole('tab', { name: 'Automations' }).click();
    await settings.getByRole('button', { name: 'Add automation' }).click();
    await settings.getByLabel('Name').fill(automationName);
    const creation = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await settings.getByRole('button', { name: 'Create automation' }).click();
    await creation;
    await expect(
      settings.getByText(automationName, { exact: true }),
    ).toBeVisible();
    await settings.getByRole('button', { exact: true, name: 'Done' }).click();

    await page.getByRole('button', { name: 'Add task to Blocked' }).click();
    const taskDialog = page.getByRole('dialog', {
      name: 'Create task in Blocked',
    });
    await taskDialog.getByLabel('Title').fill(taskTitle);
    const taskCreation = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await taskDialog.getByRole('button', { name: 'Save' }).click();
    await taskCreation;
    await page.reload();
    await expect(page.getByRole('article', { name: taskTitle })).toBeVisible();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await dragTask(page, taskTitle, 'Done');

    const card = page.getByRole('article', { name: taskTitle });
    await card.locator('.task-card').click();
    const detail = page.getByRole('dialog', { name: taskTitle });
    await expect(detail.getByText('Completed', { exact: true })).toBeVisible();
    await expect(detail.getByText('No value')).toHaveCount(1);
    await detail.getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('button', { name: /^Settings/ }).click();
    const cleanup = page.getByRole('dialog', { name: /^Settings/ });
    await cleanup.getByRole('tab', { name: 'Automations' }).click();
    const automationRow = cleanup
      .getByRole('article')
      .filter({ hasText: automationName });
    await automationRow
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    const confirmation = page.getByRole('alertdialog');
    const deletion = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await confirmation
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await deletion;
    await cleanup.getByRole('button', { exact: true, name: 'Done' }).click();
    await deleteTask(page, taskTitle);
  });

  /** Proves a past scheduled rule catches up once and creates its template task. */
  test('creates a parameterized scheduled task on the next board read', async ({
    page,
  }, testInfo) => {
    const automationName = `E2E Scheduled ${process.pid}-${testInfo.repeatEachIndex}`;
    const taskTitle = 'E2E Scheduled 2000-02-01';
    await login(page);
    await page.getByRole('button', { name: /^Settings/ }).click();
    const settings = page.getByRole('dialog', { name: /^Settings/ });
    await settings.getByRole('tab', { name: 'Automations' }).click();
    await settings.getByRole('button', { name: 'Add automation' }).click();
    await settings.getByLabel('Name').fill(automationName);
    await settings.getByRole('button', { name: 'Start when' }).click();
    await page
      .getByRole('option', { exact: true, name: 'A date arrives' })
      .click();
    const scheduledDate = settings.getByRole('group', { name: 'Run on' });
    await scheduledDate.getByRole('spinbutton').nth(0).fill('2');
    await scheduledDate.getByRole('spinbutton').nth(1).fill('1');
    await scheduledDate.getByRole('spinbutton').nth(2).fill('2000');
    await settings
      .getByLabel('Generated task title')
      .fill('E2E Scheduled {{date}}');
    const persistence = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await settings.getByRole('button', { name: 'Create automation' }).click();
    await persistence;
    await expect(
      settings.getByText(automationName, { exact: true }),
    ).toBeVisible();
    await settings.getByRole('button', { exact: true, name: 'Done' }).click();

    await page.reload();
    await expect(page.getByRole('article', { name: taskTitle })).toBeVisible();
    await page.getByRole('button', { name: /^Settings/ }).click();
    const cleanup = page.getByRole('dialog', { name: /^Settings/ });
    await cleanup.getByRole('tab', { name: 'Automations' }).click();
    const automationRow = cleanup
      .getByRole('article')
      .filter({ hasText: automationName });
    await automationRow
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await cleanup.getByRole('button', { exact: true, name: 'Done' }).click();
    await deleteTask(page, taskTitle);
  });

  /** Proves configurable terminal color reaches the rendered Kanban column. */
  test('configures a colored terminal status', async ({ page }, testInfo) => {
    const statusName = `E2E Archived ${process.pid}-${testInfo.repeatEachIndex}`;
    const updatedStatusName = `${statusName} updated`;
    await login(page);
    await page.getByRole('button', { name: /^Settings/ }).click();

    const settings = page.getByRole('dialog', { name: /^Settings/ });
    await settings.getByRole('tab', { name: 'Statuses' }).click();

    const moveRight = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await settings.getByRole('button', { name: 'Move Blocked right' }).click();
    await moveRight;
    await expect(settings).toBeVisible();
    const moveLeft = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await settings.getByRole('button', { name: 'Move Blocked left' }).click();
    await moveLeft;
    await expect(settings).toBeVisible();

    await settings.getByRole('button', { name: 'Add status' }).click();
    await settings.getByLabel('Name').fill(statusName);
    await settings.getByRole('button', { name: /Color/ }).click();
    await page.getByLabel('Hex color').fill('#A855F7');
    await page.keyboard.press('Escape');
    await settings.getByText('Terminal status', { exact: true }).click();
    const creation = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await settings.getByRole('button', { name: 'Create status' }).click();
    await creation;
    await expect(settings).toBeVisible();
    await settings.getByRole('button', { name: `Edit ${statusName}` }).click();
    await settings
      .getByRole('textbox', { name: 'Name' })
      .fill(updatedStatusName);
    const update = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await settings.getByRole('button', { name: 'Save' }).click();
    await update;
    await expect(settings).toBeVisible();
    await expect(
      settings.getByText(updatedStatusName, { exact: true }),
    ).toBeVisible();
    await settings.getByRole('button', { exact: true, name: 'Done' }).click();

    const column = page.getByRole('region', { name: updatedStatusName });
    await expect(column).toBeVisible();
    await expect(column).toHaveCSS('--status-color', '#A855F7');
    await expect(column.getByText('Latest 20 by due date')).toBeVisible();

    await page.getByRole('button', { name: /^Settings/ }).click();
    const reopened = page.getByRole('dialog', { name: /^Settings/ });
    await reopened.getByRole('tab', { name: 'Statuses' }).click();
    await reopened
      .getByRole('button', { name: `Edit ${updatedStatusName}` })
      .click();
    await expect(reopened.getByText('#A855F7', { exact: true })).toBeVisible();
    await expect(
      reopened.getByRole('checkbox', { name: 'Terminal status' }),
    ).toBeChecked();
    await reopened.getByRole('button', { name: 'Cancel' }).click();
    await reopened
      .getByRole('button', { name: `Delete status ${updatedStatusName}` })
      .last()
      .click();
    const confirmation = page.getByRole('alertdialog');
    const deletion = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await confirmation.getByRole('button', { name: 'Delete status' }).click();
    await deletion;
    await expect(reopened).toBeVisible();
    await expect(
      reopened.getByText(updatedStatusName, { exact: true }),
    ).toHaveCount(0);
  });

  /** Proves pointer dragging moves a task across columns and persists after reload. */
  test('moves a task by drag and drop', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Add task to Blocked' }).click();
    const dialog = page.getByRole('dialog', {
      name: 'Create task in Blocked',
    });
    await dialog.getByLabel('Title').fill('E2E Drag');
    const creation = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await creation;
    await expect(dialog).toBeHidden();

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
    await page.getByRole('button', { name: 'Add task to Blocked' }).click();
    const dialog = page.getByRole('dialog', {
      name: 'Create task in Blocked',
    });
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
