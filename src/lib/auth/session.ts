import 'server-only';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/server';
import { DomainError } from '@/lib/validation/errors';

/** Reads the revocable database session; never trusts legacy cookies. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Returns true only after mandatory 2FA enrollment has been verified. */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return Boolean(
    session?.user.twoFactorEnabled && !session.user.passwordChangeRequired,
  );
}

/** Rejects mutations until password and mandatory 2FA are satisfied. */
export async function requireAuthenticated(): Promise<void> {
  if (!(await isAuthenticated()))
    throw new DomainError('The session has expired.', 'UNAUTHORIZED');
}

/** Revokes the current session and clears its browser cookie. */
export async function destroySession(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
}
