import 'server-only';
import { db } from '@/lib/db/client';

/** Checks live consent so revoked clients and permission reductions take effect immediately. */
export async function hasActiveMcpGrant(
  userId: string,
  clientId: string,
  scopes: string[],
): Promise<boolean> {
  const grant = await db.oauthConsent.findFirst({
    where: {
      userId,
      clientId,
      user: { twoFactorEnabled: true, passwordChangeRequired: false },
      oauthclient: { disabled: false },
    },
    select: { scopes: true },
  });
  return Boolean(
    grant && scopes.every((scope) => grant.scopes.includes(scope)),
  );
}
