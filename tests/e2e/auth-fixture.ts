import { createOTP } from '@better-auth/utils/otp';
import { hashPassword, symmetricEncrypt } from 'better-auth/crypto';
import { PrismaClient } from '@/generated/prisma';
import { expect, type Page, type APIRequestContext } from '@playwright/test';

export const TEST_EMAIL = 'owner@example.test';
export const TEST_PASSWORD = process.env.PASSWORD ?? 'test-password';
export const TEST_TOTP_SECRET = 'disposable-test-authenticator-secret';
export const authDb = new PrismaClient({
  datasourceUrl:
    process.env.TEST_DATABASE_URL ??
    `postgresql://postgres:postgres@localhost:${process.env.TEST_DATABASE_PORT ?? '55433'}/simple_tasks_test?schema=public`,
});

/** Seeds credentials only into the explicitly disposable test datasource. */
export async function seedTestOwner() {
  await authDb.user.deleteMany();
  await authDb.user.create({
    data: {
      id: 'e2e-owner',
      name: 'Test owner',
      email: TEST_EMAIL,
      emailVerified: true,
      twoFactorEnabled: true,
    },
  });
  await authDb.account.create({
    data: {
      id: 'e2e-account',
      accountId: 'e2e-owner',
      providerId: 'credential',
      userId: 'e2e-owner',
      password: await hashPassword(TEST_PASSWORD),
    },
  });
  await authDb.twoFactor.create({
    data: {
      id: 'e2e-factor',
      userId: 'e2e-owner',
      verified: true,
      secret: await symmetricEncrypt({
        key: process.env.BETTER_AUTH_SECRET!,
        data: TEST_TOTP_SECRET,
      }),
      backupCodes: await symmetricEncrypt({
        key: process.env.BETTER_AUTH_SECRET!,
        data: JSON.stringify(['test-recovery-1', 'test-recovery-2']),
      }),
    },
  });
  await authDb.rateLimit.deleteMany();
}

/** Exercises the visible password and TOTP steps using the isolated owner's credentials. */
export async function loginOwner(page: Page) {
  await authDb.rateLimit.deleteMany();
  await page.goto('/login');
  const es = (await page.locator('html').getAttribute('lang')) === 'es';
  await page
    .getByLabel(es ? 'Correo electrónico' : 'Email', { exact: true })
    .fill(TEST_EMAIL);
  await page
    .getByLabel(es ? 'Contraseña' : 'Password', { exact: true })
    .fill(TEST_PASSWORD);
  await page
    .getByRole('button', { name: es ? 'Entrar' : 'Sign in', exact: true })
    .click();
  await page
    .getByLabel(es ? 'Código del autenticador' : 'Authenticator code', {
      exact: true,
    })
    .fill(await createOTP(TEST_TOTP_SECRET).totp());
  await page
    .getByRole('button', { name: es ? 'Verificar' : 'Verify', exact: true })
    .click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Obtains a real 2FA session for OAuth protocol tests; never bypasses application checks. */
export async function loginRequest(context: APIRequestContext) {
  await authDb.rateLimit.deleteMany();
  const login = await context.post('/api/auth/sign-in/email', {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  expect(login.ok(), await login.text()).toBe(true);
  const verify = await context.post('/api/auth/two-factor/verify-totp', {
    data: { code: await createOTP(TEST_TOTP_SECRET).totp() },
  });
  expect(verify.ok()).toBe(true);
}
