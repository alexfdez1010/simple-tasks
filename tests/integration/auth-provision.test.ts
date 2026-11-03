import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { defaultKeyHasher } from '@better-auth/api-key';
import { verifyPassword } from 'better-auth/crypto';
import { db } from '@/lib/db/client';
import { provisionOwner, migrateLegacyOwner } from '@/lib/auth/provision';
import { generateApiToken } from '@/lib/api-tokens/crypto';

/** Clears only authentication fixtures in this suite's disposable database. */
async function cleanup() {
  await db.user.deleteMany();
  await db.apikey.deleteMany();
  await db.apiToken.deleteMany();
}

describe('single-owner credential migration', () => {
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await db.$disconnect();
  });

  it('hashes a legacy password, enforces replacement and never overwrites the owner', async () => {
    expect(await migrateLegacyOwner(db, 'owner@example.test', 'legacy')).toBe(
      true,
    );
    const owner = await db.user.findFirstOrThrow();
    const account = await db.account.findFirstOrThrow();
    expect(owner.passwordChangeRequired).toBe(true);
    expect(owner.twoFactorEnabled).toBe(false);
    expect(account.password).not.toBe('legacy');
    expect(
      await verifyPassword({ password: 'legacy', hash: account.password! }),
    ).toBe(true);
    expect(
      await migrateLegacyOwner(
        db,
        'other@example.test',
        'replacement-password',
      ),
    ).toBe(false);
    await expect(
      provisionOwner(db, {
        email: 'other@example.test',
        password: 'replacement-password',
      }),
    ).rejects.toThrow();
    expect(await db.user.count()).toBe(1);
    expect((await db.account.findFirstOrThrow()).password).toBe(
      account.password,
    );
  });

  it('migrates active and revoked REST credentials without needing their raw values', async () => {
    const { token, tokenHash, hint } = generateApiToken();
    await db.apiToken.create({
      data: {
        id: 'provision-active',
        name: 'test:provision',
        tokenHash,
        hint,
        canWrite: true,
      },
    });
    const revoked = generateApiToken();
    await db.apiToken.create({
      data: {
        id: 'provision-revoked',
        name: 'test:provision',
        tokenHash: revoked.tokenHash,
        hint: revoked.hint,
        canWrite: false,
        revokedAt: new Date(),
      },
    });
    await provisionOwner(db, {
      email: 'owner@example.test',
      password: 'strong-owner-password',
    });
    const active = await db.apikey.findUniqueOrThrow({
      where: { id: 'provision-active' },
    });
    expect(active.key).toBe(await defaultKeyHasher(token));
    expect(active.permissions).toBe(
      JSON.stringify({ tasks: ['read', 'write'] }),
    );
    expect(active.enabled).toBe(true);
    expect(
      (
        await db.apikey.findUniqueOrThrow({
          where: { id: 'provision-revoked' },
        })
      ).enabled,
    ).toBe(false);
    expect((await db.user.findFirstOrThrow()).passwordChangeRequired).toBe(
      false,
    );
  });

  it('does nothing without explicit legacy migration inputs', async () => {
    expect(await migrateLegacyOwner(db)).toBe(false);
    expect(await db.user.count()).toBe(0);
  });
});
