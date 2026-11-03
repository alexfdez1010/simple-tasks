'use server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';

/** Replaces a legacy password through Better Auth, then requires a fresh two-factor sign-in. */
export async function changeOwnerPassword(
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  const session = await getSession();
  if (!session?.user.twoFactorEnabled) return false;
  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: { currentPassword, newPassword, revokeOtherSessions: true },
    });
    await db.$transaction([
      db.user.update({
        where: { id: session.user.id },
        data: { passwordChangeRequired: false },
      }),
      db.session.deleteMany({ where: { userId: session.user.id } }),
    ]);
    await auth.api.signOut({ headers: await headers() });
    return true;
  } catch {
    return false;
  }
}
