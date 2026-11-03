import { getSessionCookie } from 'better-auth/cookies';
import { z } from 'zod';
import { getAuthConfig } from '@/lib/auth/config';

const sessionSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    twoFactorEnabled: z.boolean().nullable(),
    passwordChangeRequired: z.boolean(),
  }),
});

/**
 * Validates incoming cookies through the canonical Better Auth endpoint.
 * Returns null for anonymous requests; throws on unavailable or malformed validation.
 * Keeps Prisma and its native engine out of Vercel's isolated proxy bundle.
 */
export async function getProxySession(headers: Headers) {
  if (!getSessionCookie(headers)) return null;
  const url = new URL('/api/auth/get-session', getAuthConfig().baseURL);
  url.searchParams.set('disableRefresh', 'true');
  const response = await fetch(url, {
    headers: { cookie: headers.get('cookie') ?? '' },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Session validation unavailable.');
  const data: unknown = await response.json();
  return data === null ? null : sessionSchema.parse(data);
}
