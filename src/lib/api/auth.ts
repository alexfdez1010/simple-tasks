import 'server-only';
import { db } from '@/lib/db/client';
import { auth } from '@/lib/auth/server';
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
  const verified = await auth.api.verifyApiKey({ body: { key: match[1] } });
  if (!verified.valid || !verified.key)
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'Provide a valid API bearer token.',
    );
  const owner = await db.user.findFirst({
    where: {
      id: verified.key.referenceId,
      twoFactorEnabled: true,
      passwordChangeRequired: false,
    },
  });
  const token = await db.apiToken.findUnique({
    where: { id: verified.key.id },
    select: { id: true, canWrite: true, revokedAt: true },
  });
  if (!owner || !token || token.revokedAt)
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'Provide a valid API bearer token.',
    );
  return {
    ...token,
    canWrite:
      token.canWrite &&
      verified.key.permissions?.tasks?.includes('write') === true,
  };
}
