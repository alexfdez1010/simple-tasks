'use server';
import { revalidatePath } from 'next/cache';
import { getSession, requireAuthenticated } from '@/lib/auth/session';
import { db } from '@/lib/db/client';

/** Atomically revokes the owner's Better Auth consent and every related refresh/access token. */
export async function revokeGrant(consentId: string): Promise<void> {
  await requireAuthenticated();
  const session = await getSession();
  if (!session) return;
  await db.$transaction(async (tx) => {
    const grant = await tx.oauthConsent.findFirst({
      where: { id: consentId, userId: session.user.id },
    });
    if (!grant) return;
    const where = { userId: session.user.id, clientId: grant.clientId };
    await tx.oauthAccessToken.deleteMany({ where });
    await tx.oauthRefreshToken.deleteMany({ where });
    await tx.oauthConsent.deleteMany({ where });
  });
  revalidatePath('/security');
}
