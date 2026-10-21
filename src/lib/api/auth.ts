import 'server-only';
import { db } from '@/lib/db/client';
import { hashApiToken } from '@/lib/api-tokens/crypto';
import { ApiError } from '@/lib/api/errors';

/** Resolves an active database credential; browser sessions and MCP tokens are not accepted. */
export async function authenticateApi(request: Request) {
  const match = /^Bearer (st_[A-Za-z0-9_-]{43})$/i.exec(
    request.headers.get('authorization') ?? '',
  );
  if (!match)
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'Provide a valid API bearer token.',
    );
  const token = await db.apiToken.findUnique({
    where: { tokenHash: hashApiToken(match[1]) },
    select: { id: true, canWrite: true, revokedAt: true },
  });
  if (!token || token.revokedAt)
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'Provide a valid API bearer token.',
    );
  return token;
}
