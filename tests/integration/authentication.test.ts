import { randomUUID } from 'node:crypto';
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { createOTP } from '@better-auth/utils/otp';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { db } from '@/lib/db/client';
import { auth } from '@/lib/auth/server';

const password = 'integration-owner-password';
const email = 'owner@example.test';
const cookies = new Map<string, string>();

/** Calls the actual Better Auth handler and maintains its real signed cookie jar. */
async function call(path: string, body?: unknown) {
  const response = await auth.handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Origin: 'http://localhost:3000',
        'Content-Type': 'application/json',
        'x-real-ip': '127.0.0.1',
        Cookie: [...cookies]
          .map(([key, value]) => `${key}=${value}`)
          .join('; '),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0];
    const index = pair.indexOf('=');
    cookies.set(pair.slice(0, index), pair.slice(index + 1));
  }
  return response;
}

describe('Better Auth security boundaries', () => {
  beforeAll(async () => {
    await db.user.deleteMany();
    const id = randomUUID();
    await db.user.create({
      data: { id, email, name: 'Test owner', emailVerified: true },
    });
    await db.account.create({
      data: {
        id: randomUUID(),
        providerId: 'credential',
        accountId: id,
        userId: id,
        password: await hashPassword(password),
      },
    });
  });
  beforeEach(async () => {
    await db.rateLimit.deleteMany();
  });
  afterAll(async () => {
    await db.user.deleteMany();
    await db.$disconnect();
  });

  it('stores a salted hash and closes public sign-up', async () => {
    const account = await db.account.findFirstOrThrow();
    expect(account.password).not.toBe(password);
    expect(await verifyPassword({ password, hash: account.password! })).toBe(
      true,
    );
    const response = await call('/sign-up/email', {
      email: 'intruder@example.test',
      password,
      name: 'Intruder',
    });
    expect(response.ok).toBe(false);
    expect(await db.user.count()).toBe(1);
  });

  it('enforces the singleton in the database, including attempts to bypass the default', async () => {
    const results = await Promise.allSettled(
      [true, false].map((singleton) =>
        db.user.create({
          data: {
            id: randomUUID(),
            email: `other-${singleton}@example.test`,
            name: 'Other',
            singleton,
          },
        }),
      ),
    );
    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(await db.user.count()).toBe(1);
  });

  it('enrolls TOTP, revokes password-only sessions and requires a second factor on later sign-in', async () => {
    const login = await call('/sign-in/email', { email, password });
    expect(login.status).toBe(200);
    expect(login.headers.get('set-cookie')).toMatch(/HttpOnly/i);
    const staleCookies = new Map(cookies);
    const other = await call('/sign-in/email', { email, password });
    expect(other.ok).toBe(true);
    const enrollment = await call('/two-factor/enable', { password });
    const data = await enrollment.json();
    expect(enrollment.status).toBe(200);
    expect(data.backupCodes.length).toBeGreaterThan(0);
    expect((await db.user.findFirstOrThrow()).twoFactorEnabled).toBe(false);
    const uri = new URL(data.totpURI);
    const { base32 } = await import('@better-auth/utils/base32');
    const secret = new TextDecoder().decode(
      base32.decode(uri.searchParams.get('secret')!),
    );
    const verify = await call('/two-factor/verify-totp', {
      code: await createOTP(secret).totp(),
    });
    expect(verify.status).toBe(200);
    expect((await db.user.findFirstOrThrow()).twoFactorEnabled).toBe(true);
    expect(await db.session.count()).toBe(1);
    const enabledCookies = new Map(cookies);
    cookies.clear();
    staleCookies.forEach((value, key) => cookies.set(key, value));
    expect(await (await call('/get-session')).json()).toBeNull();
    cookies.clear();
    const nextLogin = await call('/sign-in/email', { email, password });
    expect(await nextLogin.json()).toMatchObject({ twoFactorRedirect: true });
    expect(await (await call('/get-session')).json()).toBeNull();
    const wrong = await call('/two-factor/verify-totp', { code: 'wrong' });
    expect(wrong.ok).toBe(false);
    const trusted = await call('/two-factor/verify-totp', {
      code: await createOTP(secret).totp(),
      trustDevice: true,
    });
    expect(trusted.status).toBe(400);
    const recovery = await call('/two-factor/verify-backup-code', {
      code: data.backupCodes[0],
    });
    expect(recovery.status).toBe(200);
    expect(await (await call('/get-session')).json()).toHaveProperty(
      'user.email',
      email,
    );
    await call('/sign-out', {});
    expect(await (await call('/get-session')).json()).toBeNull();
    cookies.clear();
    await call('/sign-in/email', { email, password });
    const replay = await call('/two-factor/verify-backup-code', {
      code: data.backupCodes[0],
    });
    expect(replay.ok).toBe(false);
    cookies.clear();
    enabledCookies.forEach((value, key) => cookies.set(key, value));
    expect((await call('/two-factor/disable', { password })).status).toBe(404);
  });

  it('advertises OAuth discovery and enforces PKCE for public clients', async () => {
    const discovery = await call('/.well-known/oauth-authorization-server');
    expect(discovery.status).toBe(200);
    expect(await discovery.json()).toMatchObject({
      code_challenge_methods_supported: ['S256'],
      scopes_supported: expect.arrayContaining(['tasks:read', 'tasks:write']),
    });
    const registration = await call('/oauth2/register', {
      client_name: 'Security test',
      redirect_uris: ['http://127.0.0.1:4545/callback'],
      token_endpoint_auth_method: 'none',
      application_type: 'native',
      grant_types: ['authorization_code', 'refresh_token'],
    });
    const client = await registration.json();
    expect(registration.status, JSON.stringify(client)).toBe(201);
    const response = await auth.handler(
      new Request(
        `http://localhost:3000/api/auth/oauth2/authorize?client_id=${client.client_id}&redirect_uri=http%3A%2F%2F127.0.0.1%3A4545%2Fcallback&response_type=code&scope=tasks%3Aread&resource=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fmcp%2Fmcp`,
      ),
    );
    expect(
      response.status === 400 ||
        response.headers.get('location')?.includes('error='),
    ).toBeTruthy();
  });
});
