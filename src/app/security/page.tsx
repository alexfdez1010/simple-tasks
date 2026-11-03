import { redirect } from 'next/navigation';
import { AppLink } from '@/components/app-link';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { revokeGrant } from '@/lib/auth/grants';
import { AuthShell } from '@/components/auth/auth-shell';
import { PasswordChange } from '@/components/auth/password-change';
import { Enrollment } from '@/components/auth/enrollment';
import { authCopy } from '@/components/auth/copy';
import { SignOutButton } from '@/components/auth/sign-out';
import { GrantList } from '@/components/auth/grant-list';
import { getCurrentLanguage } from '@/lib/i18n/server';

/** Requires enrollment, then exposes live OAuth grants and revocation for the owner. */
export default async function SecurityPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const copy = authCopy[await getCurrentLanguage()];
  if (!session.user.twoFactorEnabled)
    return (
      <AuthShell title={copy.setup}>
        <Enrollment />
        <SignOutButton />
      </AuthShell>
    );
  if (session.user.passwordChangeRequired)
    return (
      <AuthShell title={copy.password}>
        <PasswordChange />
        <SignOutButton />
      </AuthShell>
    );
  const grants = await db.oauthConsent.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      scopes: true,
      oauthclient: { select: { name: true, clientId: true } },
    },
  });
  return (
    <AuthShell title={copy.security}>
      <div className="space-y-6">
        <p>{copy.active}</p>
        <h2 className="text-lg font-semibold">{copy.grants}</h2>
        <GrantList
          grants={grants.map((grant) => ({
            id: grant.id,
            scopes: grant.scopes,
            name: grant.oauthclient.name ?? grant.oauthclient.clientId,
          }))}
          revoke={revokeGrant}
        />
        <AppLink href="/">{copy.back}</AppLink>
        <SignOutButton />
      </div>
    </AuthShell>
  );
}
