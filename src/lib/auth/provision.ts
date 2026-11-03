import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { z } from 'zod';
import type { PrismaClient } from '@/generated/prisma';

/** Atomically creates the single owner and migrates REST hashes; never replaces an existing account. */
export async function provisionOwner(
  db: PrismaClient,
  input: { email: string; password: string },
) {
  const email = z.string().email().parse(input.email).trim().toLowerCase();
  const password = z.string().min(1).max(128).parse(input.password);
  const passwordHash = await hashPassword(password);
  await db.$transaction(async (tx) => {
    const id = randomUUID();
    await tx.user.create({
      data: {
        id,
        name: 'Alejandro',
        email,
        emailVerified: true,
        passwordChangeRequired: password.length < 12,
      },
    });
    await tx.account.create({
      data: {
        id: randomUUID(),
        accountId: id,
        providerId: 'credential',
        userId: id,
        password: passwordHash,
      },
    });
    // Better Auth uses the same SHA-256 digest with base64url rather than hexadecimal encoding.
    for (const token of await tx.apiToken.findMany()) {
      await tx.apikey.create({
        data: {
          id: token.id,
          configId: 'default',
          name: token.name,
          prefix: 'st_',
          key: Buffer.from(token.tokenHash, 'hex').toString('base64url'),
          referenceId: id,
          enabled: !token.revokedAt,
          rateLimitEnabled: false,
          createdAt: token.createdAt,
          updatedAt: new Date(),
          permissions: JSON.stringify({
            tasks: token.canWrite ? ['read', 'write'] : ['read'],
          }),
        },
      });
    }
  });
}

/** Runs the one-time Vercel build migration without extracting a protected legacy password. */
export async function migrateLegacyOwner(
  db: PrismaClient,
  email?: string,
  password?: string,
): Promise<boolean> {
  if (!email || !password || (await db.user.count())) return false;
  try {
    await provisionOwner(db, { email, password });
  } catch (error) {
    // A concurrent deployment may already have created the same owner.
    if (
      await db.user.findFirst({ where: { email: email.trim().toLowerCase() } })
    )
      return false;
    throw error;
  }
  return true;
}
