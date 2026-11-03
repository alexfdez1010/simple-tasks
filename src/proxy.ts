import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/api/mcp',
  '/api/v1',
  '/api/openapi',
  '/api-docs',
  '/.well-known',
];

/** Validates database sessions and requires 2FA enrollment before protected pages. */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  if (
    PUBLIC_PATHS.some((entry) => path === entry || path.startsWith(`${entry}/`))
  )
    return NextResponse.next();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  if (
    (!session.user.twoFactorEnabled || session.user.passwordChangeRequired) &&
    path !== '/security'
  )
    return NextResponse.redirect(new URL('/security', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
