import { auth } from '@/lib/auth/server';

/** Routes RFC 8414 and RFC 9728 discovery URLs to Better Auth's metadata handlers. */
export async function GET(request: Request): Promise<Response> {
  return auth.handler(request);
}
