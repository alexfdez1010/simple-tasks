import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const PASSWORD = process.env.PASSWORD ?? 'dev-password';

/** Authenticates a mobile browser through the same accessible login contract. */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
}

/** Drags a card with native Chromium touch input after long-press activation. */
async function touchDragTask(
  page: Page,
  title: string,
  targetStatus: string,
): Promise<void> {
  const card = page.getByRole('article', { name: title });
  const handle = card.getByRole('button', { name: `Drag ${title}` });
  const target = page
    .getByRole('region', { name: targetStatus })
    .getByRole('list');
  await handle.evaluate((element) =>
    element.scrollIntoView({ block: 'center', inline: 'center' }),
  );
  await expect(handle).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const sourceBox = await handle.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { height: box.height, width: box.width, x: box.x, y: box.y };
  });
  const targetBox = await target.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { height: box.height, width: box.width, x: box.x, y: box.y };
  });
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error('The viewport must be available.');
  }
  const start = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };
  const end = {
    x: Math.min(targetBox.x + 50, viewport.width - 12),
    y: targetBox.y + Math.min(70, targetBox.height / 2),
  };
  const client = await page.context().newCDPSession(page);
  let touchIsActive = false;
  try {
    await client.send('Input.dispatchTouchEvent', {
      touchPoints: [{ ...start, force: 1, id: 0 }],
      type: 'touchStart',
    });
    touchIsActive = true;
    await expect(card).toHaveClass(/is-dragging/);
    for (let step = 1; step <= 12; step += 1) {
      const ratio = step / 12;
      await client.send('Input.dispatchTouchEvent', {
        touchPoints: [
          {
            force: 1,
            id: 0,
            x: start.x + (end.x - start.x) * ratio,
            y: start.y + (end.y - start.y) * ratio,
          },
        ],
        type: 'touchMove',
      });
    }
    await client.send('Input.dispatchTouchEvent', {
      touchPoints: [],
      type: 'touchEnd',
    });
    touchIsActive = false;
  } finally {
    if (touchIsActive) {
      await client.send('Input.dispatchTouchEvent', {
        touchPoints: [],
        type: 'touchEnd',
      });
    }
    await client.detach();
  }
}

test.describe('mobile Kanban board', () => {
  /** Proves Pixel 7 touch dragging is the card's only state-change interaction. */
  test('moves a task between columns with touch drag and drop', async ({
    page,
  }, testInfo) => {
    const title = `E2E Mobile Touch ${process.pid}-${testInfo.repeatEachIndex}`;
    await login(page);
    await page.getByRole('button', { name: 'Add task to Blocked' }).click();
    const dialog = page.getByRole('dialog', {
      name: 'Create task in Blocked',
    });
    await dialog.getByLabel('Title').fill(title);
    const creation = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await creation;

    const card = page.getByRole('article', { name: title });
    await expect(card.getByRole('button', { name: /Move to/ })).toHaveCount(0);
    await expect(card.getByRole('combobox')).toHaveCount(0);
    await expect(
      card.getByRole('button', { name: `Drag ${title}` }),
    ).toBeVisible();
    const persistence = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await touchDragTask(page, title, 'To do');
    await persistence;

    await expect(
      page
        .getByRole('region', { name: 'To do' })
        .getByRole('article', { name: title }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole('region', { name: 'To do' })
        .getByRole('article', { name: title }),
    ).toBeVisible();

    await page.getByRole('button', { name: `Edit ${title}` }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit task' });
    await editDialog.getByRole('button', { name: 'Delete' }).click();
    const confirmation = page.getByRole('alertdialog');
    const deletion = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/',
    );
    await confirmation.getByRole('button', { name: 'Delete task' }).click();
    await deletion;
    await expect(page.getByRole('article', { name: title })).toHaveCount(0);
  });
});
