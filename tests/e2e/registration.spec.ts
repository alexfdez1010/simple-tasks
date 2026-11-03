import { expect, test } from '@playwright/test';
import { base32 } from '@better-auth/utils/base32';
import { createOTP } from '@better-auth/utils/otp';
import { verifyPassword } from 'better-auth/crypto';
import { issueOwnerInvitation } from '@/lib/auth/owner-invitation';
import {
  OWNER_INVITATION_HEADER,
  OWNER_INVITATION_ID,
} from '@/lib/auth/registration-constants';
import {
  authDb,
  seedTestOwner,
  TEST_EMAIL,
  TEST_PASSWORD,
} from './auth-fixture';

const password = 'brand-new-password-chosen-by-user';
let invitation: string;

test.beforeEach(async () => {
  const owner = await authDb.user.findFirst();
  invitation = await issueOwnerInvitation(authDb, {
    email: TEST_EMAIL,
    replaceOwnerId: owner?.id,
  });
  await authDb.rateLimit.deleteMany();
});
test.afterEach(async () => {
  await authDb.verification.deleteMany({ where: { id: OWNER_INVITATION_ID } });
  await seedTestOwner();
});

for (const width of [1280, 390]) {
  test(`creates a new account and enrolls its authenticator at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/register#invite=${invitation}`);
    await expect(
      page.getByRole('heading', { name: 'Create account', exact: true }),
    ).toBeVisible();
    expect(await (await page.request.get('/register')).text()).not.toContain(
      invitation,
    );
    await page.getByLabel('Name', { exact: true }).fill('Fresh test owner');
    await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
    await page.getByLabel('New password', { exact: true }).fill(password);
    await page
      .getByLabel('Confirm password', { exact: true })
      .fill('different-password');
    await page
      .getByRole('button', { name: 'Create account', exact: true })
      .click();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'The passwords do not match.',
    );
    expect(await authDb.user.count()).toBe(0);
    await page.getByLabel('Confirm password', { exact: true }).fill(password);
    await page.screenshot({
      path: `.impeccable/review/registration-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const requestPromise = page.waitForRequest((request) =>
      request.url().includes('/api/auth/sign-up/email'),
    );
    await page
      .getByRole('button', { name: 'Create account', exact: true })
      .click();
    const request = await requestPromise;
    expect(request.url()).not.toContain(invitation);
    expect(request.headers()[OWNER_INVITATION_HEADER]).toBe(invitation);
    await expect(page).toHaveURL(/\/security/);
    const owner = await authDb.user.findFirstOrThrow();
    const credential = await authDb.account.findFirstOrThrow();
    expect(owner.name).toBe('Fresh test owner');
    expect(owner.id).not.toBe('e2e-owner');
    expect(await verifyPassword({ password, hash: credential.password! })).toBe(
      true,
    );
    expect(
      await verifyPassword({
        password: TEST_PASSWORD,
        hash: credential.password!,
      }),
    ).toBe(false);
    expect(owner.twoFactorEnabled).toBe(false);
    await page.goto('/');
    await expect(page).toHaveURL(/\/security/);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page
      .getByRole('button', { name: 'Set up authenticator', exact: true })
      .click();
    const secret = await page
      .getByLabel('Manual setup key', { exact: true })
      .inputValue();
    await page
      .getByLabel('Authenticator code', { exact: true })
      .fill(await createOTP(base32.decode(secret)).totp());
    await page.getByRole('button', { name: 'Verify', exact: true }).click();
    await page.getByText('I have saved the codes', { exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Tasks', exact: true }),
    ).toBeVisible();
    expect(await authDb.user.count()).toBe(1);
    expect(
      await authDb.verification.count({ where: { id: OWNER_INVITATION_ID } }),
    ).toBe(0);
    await page.goto(`/register#invite=${invitation}`);
    await expect(
      page.getByRole('heading', { name: 'Registration is closed' }),
    ).toBeVisible();
    const replay = await page.request.post('/api/auth/sign-up/email', {
      headers: {
        Origin: 'http://localhost:3000',
        [OWNER_INVITATION_HEADER]: invitation,
      },
      data: { name: 'Intruder', email: TEST_EMAIL, password },
    });
    expect(replay.status()).toBe(403);
  });
}

test('rejects a forged link without consuming the invitation and explains missing links', async ({
  page,
}) => {
  await page.goto(`/register#invite=${'x'.repeat(43)}`);
  await page.getByLabel('Name', { exact: true }).fill('Uninvited');
  await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
  await page.getByLabel('New password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Unable to create the account',
  );
  expect(await authDb.user.count()).toBe(0);
  expect(
    await authDb.verification.count({ where: { id: OWNER_INVITATION_ID } }),
  ).toBe(1);
  await page.goto('/register');
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'Open your private signup link to create your account.',
  );
});
