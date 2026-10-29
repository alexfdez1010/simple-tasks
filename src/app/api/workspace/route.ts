import { createHash } from 'node:crypto';
import { isAuthenticated } from '@/lib/auth/session';
import { getWorkspaceSnapshot } from '@/lib/coordination/snapshot';

export const dynamic = 'force-dynamic';

/** Returns an authenticated snapshot, or 304 for an unchanged graph; never exposes data to anonymous clients. */
export async function GET(request: Request): Promise<Response> {
  if (!(await isAuthenticated()))
    return Response.json({ error: 'Session expired.' }, { status: 401 });
  const json = JSON.stringify(await getWorkspaceSnapshot());
  const etag = `"${createHash('sha256').update(json).digest('hex')}"`;
  const headers = {
    ETag: etag,
    'Cache-Control': 'private, no-cache',
    Vary: 'Cookie',
  };
  if (request.headers.get('if-none-match') === etag)
    return new Response(null, { status: 304, headers });
  return new Response(json, {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
