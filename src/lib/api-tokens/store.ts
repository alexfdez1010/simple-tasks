import 'server-only';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { runSerializable } from '@/lib/db/transaction';
import { auth } from '@/lib/auth/server';
import { hashApiToken } from '@/lib/api-tokens/crypto';
import { conflict, notFound } from '@/lib/validation/errors';
import { idSchema } from '@/lib/validation/common';

export const tokenMetadata = {
  id: true,
  name: true,
  hint: true,
  canWrite: true,
  createdAt: true,
  lastUsedAt: true,
  revokedAt: true,
} as const;
const tokenInput = z
  .object({ name: z.string().trim().min(1).max(80), canWrite: z.boolean() })
  .strict();

/** Lists non-secret token metadata, newest first; callers must authenticate. */
export function listApiTokens() {
  return db.apiToken.findMany({
    select: tokenMetadata,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

/** Creates a non-expiring token; caps active credentials at 25 and returns its secret once. */
export async function createApiToken(input: unknown) {
  const parsed = tokenInput.parse(input);
  const owner = await db.user.findFirstOrThrow({
    where: { twoFactorEnabled: true, passwordChangeRequired: false },
  });
  const key = await auth.api.createApiKey({
    body: {
      name: parsed.name,
      userId: owner.id,
      permissions: { tasks: parsed.canWrite ? ['read', 'write'] : ['read'] },
    },
  });
  const token = key.key;
  try {
    const metadata = await runSerializable(db, async (tx) => {
      const active = await tx.apiToken.count({ where: { revokedAt: null } });
      if (active >= 25)
        throw conflict('Revoke an active token before creating another.');
      return tx.apiToken.create({
        data: {
          ...parsed,
          id: key.id,
          tokenHash: hashApiToken(token),
          hint: `${token.slice(0, 11)}…${token.slice(-4)}`,
        },
        select: tokenMetadata,
      });
    });
    return { token, metadata };
  } catch (error) {
    await db.apikey.delete({ where: { id: key.id } });
    throw error;
  }
}

/** Revokes an existing token idempotently; future authorization fails immediately. */
export async function revokeApiToken(id: string): Promise<void> {
  const where = { id: idSchema.parse(id) };
  const existing = await db.apiToken.findUnique({
    where,
    select: { id: true },
  });
  if (!existing) throw notFound('The token');
  await db.$transaction([
    db.apiToken.updateMany({
      where: { ...where, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    db.apikey.updateMany({ where, data: { enabled: false } }),
  ]);
}
