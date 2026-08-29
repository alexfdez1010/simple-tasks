import 'server-only';

import { cookies } from 'next/headers';

import { getAuthConfig } from '@/lib/auth/config';
import { AUTH_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/constants';
import { createSessionToken, timingSafeMatch } from '@/lib/auth/token';
import { DomainError } from '@/lib/validation/errors';

/** Verifies the shared password and creates a hardened browser session cookie. */
export async function createSession(password: string): Promise<boolean> {
  const config = getAuthConfig();
  const isValid = await timingSafeMatch(
    password,
    config.password,
    config.secret,
  );
  if (!isValid) return false;
  const cookieStore = await cookies();
  cookieStore.set(
    AUTH_COOKIE,
    await createSessionToken(config.password, config.secret),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    },
  );
  return true;
}

/** Removes the browser session cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

/** Checks the current request's session cookie against current credentials. */
export async function isAuthenticated(): Promise<boolean> {
  const config = getAuthConfig();
  const cookieStore = await cookies();
  const candidate = cookieStore.get(AUTH_COOKIE)?.value;
  if (!candidate) return false;
  const expected = await createSessionToken(config.password, config.secret);
  return timingSafeMatch(candidate, expected, config.secret);
}

/** Rejects unauthenticated server-side mutations. */
export async function requireAuthenticated(): Promise<void> {
  if (!(await isAuthenticated())) {
    throw new DomainError('The session has expired.', 'UNAUTHORIZED');
  }
}
