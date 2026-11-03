import { expect, test } from '@playwright/test';
import { createOTP } from '@better-auth/utils/otp';
import { base32 } from '@better-auth/utils/base32';
import {
  authDb,
  loginOwner,
  seedTestOwner,
  TEST_EMAIL,
  TEST_PASSWORD,
} from './auth-fixture';

test.describe('Better Auth gateway', () => {
  test.afterEach(async () => {
    await seedTestOwner();
  });
  test('redirects anonymous visitors and rejects legacy shared cookies', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'simple-tasks-session',
        value: 'legacy-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.goto('/');
    await page.screenshot({
      path: '.impeccable/review/auth-login-desktop.png',
    });
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole('heading', { name: 'Sign in', exact: true }),
    ).toBeVisible();
  });

  test('rejects an incorrect password', async ({ page }) => {
    await authDb.rateLimit.deleteMany();
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
    await page
      .getByLabel('Password', { exact: true })
      .fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('requires the authenticator after the password and offers one-use recovery', async ({
    page,
  }) => {
    await authDb.rateLimit.deleteMany();
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(
      page.getByLabel('Authenticator code', { exact: true }),
    ).toBeVisible();
    expect(
      await (await page.request.get('/api/auth/get-session')).json(),
    ).toBeNull();
    await page
      .getByRole('button', { name: 'Use a recovery code', exact: true })
      .click();
    await page
      .getByLabel('Recovery code', { exact: true })
      .fill('test-recovery-1');
    await page.getByRole('button', { name: 'Verify', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Tasks', exact: true }),
    ).toBeVisible();
  });

  test('replaces shared MCP secrets with OAuth setup and security management', async ({
    page,
  }) => {
    await loginOwner(page);
    await page.goto('/skill');
    await expect(page.getByText(/Connect with OAuth/)).toBeVisible();
    await expect(page.getByLabel('MCP token')).toHaveCount(0);
    await page
      .getByRole('link', { name: 'Manage security and connections' })
      .click();
    await expect(
      page.getByText('Two-factor authentication enabled', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('blocks the board until enrollment and a short legacy password are replaced', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await authDb.twoFactor.deleteMany();
    await authDb.session.deleteMany();
    await authDb.user.update({
      where: { id: 'e2e-owner' },
      data: { twoFactorEnabled: false, passwordChangeRequired: true },
    });
    await authDb.rateLimit.deleteMany();
    try {
      await page.goto('/login');
      await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
      await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(/\/security/);
      await page.goto('/');
      await expect(page).toHaveURL(/\/security/);
      await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
      await page
        .getByRole('button', { name: 'Set up authenticator', exact: true })
        .click();
      const secret = await page
        .getByLabel('Manual setup key', { exact: true })
        .inputValue();
      await expect(page.getByRole('img', { name: 'QR TOTP' })).toBeVisible();
      await page.screenshot({
        path: '.impeccable/review/auth-enrollment-phone.png',
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);

      await page
        .getByLabel('Authenticator code', { exact: true })
        .fill(await createOTP(base32.decode(secret)).totp());
      await page.getByRole('button', { name: 'Verify', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Continue', exact: true }),
      ).toBeDisabled();
      await page.getByText('I have saved the codes', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await expect(
        page.getByLabel('New password', { exact: true }),
      ).toBeVisible();
      const replacement = 'replacement-password-for-test';
      await page
        .getByLabel('Current password', { exact: true })
        .fill(TEST_PASSWORD);
      await page.getByLabel('New password', { exact: true }).fill(replacement);
      await page
        .getByLabel('Confirm password', { exact: true })
        .fill(replacement);
      await page
        .getByRole('button', { name: 'Change password', exact: true })
        .click();
      await expect(page).toHaveURL(/\/login/);
      expect(
        (await authDb.user.findFirstOrThrow()).passwordChangeRequired,
      ).toBe(false);
      expect(await authDb.session.count()).toBe(0);
    } finally {
      await seedTestOwner();
    }
  });
});
