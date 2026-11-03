import { randomUUID } from 'node:crypto';
import { beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { issueOwnerInvitation } from '@/lib/auth/owner-invitation';
import {
  OWNER_INVITATION_ID,
  OWNER_INVITATION_HEADER,
} from '@/lib/auth/registration-constants';

const email = 'new-owner@example.test';
const password = 'new-password-chosen-by-owner';

/** Sends an actual Better Auth signup request; invitation secrets never enter the URL. */
async function signup(token?: string, requestedEmail = email) {
  return auth.handler(
    new Request('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:3000',
        'Content-Type': 'application/json',
        'x-real-ip': '127.0.0.1',
        ...(token ? { [OWNER_INVITATION_HEADER]: token } : {}),
      },
      body: JSON.stringify({
        name: 'Fresh Owner',
        email: requestedEmail,
        password,
      }),
    }),
  );
}

/** Removes authentication fixtures only, without modifying board data. */
async function cleanup() {
  await db.user.deleteMany();
  await db.apikey.deleteMany();
  await db.verification.deleteMany({ where: { id: OWNER_INVITATION_ID } });
  await db.rateLimit.deleteMany();
  await db.task.deleteMany({ where: { title: 'test:registration:board' } });
}

describe('private single-owner registration', () => {
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await db.$disconnect();
  });

  it('issues a hashed one-use invitation without generating a user or password', async () => {
    const token = await issueOwnerInvitation(db, { email });
    const stored = await db.verification.findUniqueOrThrow({
      where: { id: OWNER_INVITATION_ID },
    });
    expect(stored.identifier).not.toContain(token);
    expect(stored.value).toBe(email);
    expect(stored.expiresAt > new Date()).toBe(true);
    expect(await db.user.count()).toBe(0);
    expect(await db.account.count()).toBe(0);
  });

  it('rejects missing, forged, wrong-email and expired invitations without consuming a valid link', async () => {
    const token = await issueOwnerInvitation(db, { email });
    for (const response of [
      await signup(),
      await signup('x'.repeat(43)),
      await signup(token, 'intruder@example.test'),
    ])
      expect(response.status).toBe(403);
    expect(await db.user.count()).toBe(0);
    expect(
      await db.verification.count({ where: { id: OWNER_INVITATION_ID } }),
    ).toBe(1);
    await db.verification.update({
      where: { id: OWNER_INVITATION_ID },
      data: { expiresAt: new Date(0) },
    });
    expect((await signup(token)).status).toBe(403);
  });

  it('creates the chosen name and new password through Better Auth and closes registration', async () => {
    const token = await issueOwnerInvitation(db, { email });
    const response = await signup(token);
    expect(response.status).toBe(200);
    const user = await db.user.findFirstOrThrow();
    const credential = await db.account.findFirstOrThrow();
    expect(user).toMatchObject({
      name: 'Fresh Owner',
      email,
      emailVerified: true,
      twoFactorEnabled: false,
      passwordChangeRequired: false,
    });
    expect(credential.password).not.toBe(password);
    expect(await verifyPassword({ password, hash: credential.password! })).toBe(
      true,
    );
    expect(await db.session.count()).toBe(1);
    expect(
      await db.verification.count({ where: { id: OWNER_INVITATION_ID } }),
    ).toBe(0);
    expect((await signup(token)).status).toBe(403);
    expect(await db.user.count()).toBe(1);
  });

  it('allows exactly one successful signup under concurrent requests', async () => {
    const token = await issueOwnerInvitation(db, { email });
    const responses = await Promise.all([signup(token), signup(token)]);
    expect(responses.filter((response) => response.ok)).toHaveLength(1);
    expect(await db.user.count()).toBe(1);
    expect(await db.account.count()).toBe(1);
  });

  it('rolls the invitation consumption back if credential creation fails', async () => {
    const token = await issueOwnerInvitation(db, { email });
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    await db.$executeRawUnsafe(
      `ALTER TABLE "account" ADD CONSTRAINT "registration_test_failure" CHECK ("providerId" <> 'credential')`,
    );
    try {
      expect((await signup(token)).ok).toBe(false);
      expect(await db.user.count()).toBe(0);
      expect(await db.account.count()).toBe(0);
      expect(await db.session.count()).toBe(0);
      expect(
        await db.verification.count({ where: { id: OWNER_INVITATION_ID } }),
      ).toBe(1);
    } finally {
      await db.$executeRawUnsafe(
        'ALTER TABLE "account" DROP CONSTRAINT "registration_test_failure"',
      );
      silence.mockRestore();
    }
    await db.rateLimit.deleteMany();
    expect((await signup(token)).status).toBe(200);
  });

  it('requires the exact incorrect owner id to reset credentials, preserving the board', async () => {
    const id = randomUUID();
    await db.user.create({
      data: { id, email, name: 'Incorrect migrated owner' },
    });
    await db.account.create({
      data: {
        id: randomUUID(),
        userId: id,
        providerId: 'credential',
        accountId: id,
        password: await hashPassword('old-migrated-password'),
      },
    });
    await db.session.create({
      data: {
        id: randomUUID(),
        token: 'old-session-token',
        userId: id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await db.apikey.create({
      data: {
        id: randomUUID(),
        referenceId: id,
        key: 'old-key-hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const task = await db.task.create({
      data: { title: 'test:registration:board', statusId: 'todo', position: 0 },
    });
    await expect(issueOwnerInvitation(db, { email })).rejects.toThrow(
      'An owner already exists',
    );
    expect(await db.user.count()).toBe(1);
    const token = await issueOwnerInvitation(db, { email, replaceOwnerId: id });
    expect(await db.user.count()).toBe(0);
    expect(await db.session.count()).toBe(0);
    expect(await db.apikey.count()).toBe(0);
    expect(await db.task.findUnique({ where: { id: task.id } })).toEqual(task);
    expect((await signup(token)).status).toBe(200);
    expect((await db.user.findFirstOrThrow()).id).not.toBe(id);
    const credential = await db.account.findFirstOrThrow();
    expect(
      await verifyPassword({
        password: 'old-migrated-password',
        hash: credential.password!,
      }),
    ).toBe(false);
  });
});
