import { NextResponse, type NextRequest } from 'next/server';
import { getProxySession } from '@/lib/auth/proxy-session';

const PUBLIC_PATHS = [
  '/login',
  '/register',
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
  let session: Awaited<ReturnType<typeof getProxySession>>;
  try {
    session = await getProxySession(request.headers);
  } catch {
    return new NextResponse('Session validation temporarily unavailable.', {
      status: 503,
      headers: { 'Retry-After': '5', 'Cache-Control': 'no-store' },
    });
  }
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
