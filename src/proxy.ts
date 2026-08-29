import { NextResponse, type NextRequest } from 'next/server';

import { getAuthConfig } from '@/lib/auth/config';
import { AUTH_COOKIE } from '@/lib/auth/constants';
import { createSessionToken, timingSafeMatch } from '@/lib/auth/token';

const PUBLIC_PATHS = ['/login', '/api/mcp'];

/** Identifies routes that use their own authentication or host the login form. */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Performs an optimistic session check before protected pages render. */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (isPublicPath(request.nextUrl.pathname)) return NextResponse.next();
  const config = getAuthConfig();
  const candidate = request.cookies.get(AUTH_COOKIE)?.value;
  const expected = await createSessionToken(config.password, config.secret);
  const isValid = candidate
    ? await timingSafeMatch(candidate, expected, config.secret)
    : false;
  if (isValid) return NextResponse.next();
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
