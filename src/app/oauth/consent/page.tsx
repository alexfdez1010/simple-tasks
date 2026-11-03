import { verifyOAuthQueryParams } from '@better-auth/oauth-provider';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { AuthShell } from '@/components/auth/auth-shell';
import { ConsentForm } from '@/components/auth/consent-form';
import { authCopy } from '@/components/auth/copy';
import { getCurrentLanguage } from '@/lib/i18n/server';

/** Validates the signed request and client before displaying delegatable scopes. */
export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value ? [value] : [])
      params.append(name, item);
  }
  const copy = authCopy[await getCurrentLanguage()];
  const { secret } = await auth.$context;
  const valid = await verifyOAuthQueryParams(params.toString(), secret);
  const client = valid
    ? await db.oauthClient.findUnique({
        where: { clientId: params.get('client_id') ?? '' },
      })
    : null;
  const scopes = params.get('scope')?.split(' ').filter(Boolean) ?? [];
  if (!client || client.disabled || !scopes.includes('tasks:read'))
    return (
      <AuthShell title={copy.requestInvalid}>
        <p role="alert">{copy.requestInvalid}</p>
      </AuthShell>
    );
  const session = await getSession();
  if (!session)
    redirect(`/login?next=${encodeURIComponent(`/oauth/consent?${params}`)}`);
  if (!session.user.twoFactorEnabled || session.user.passwordChangeRequired)
    redirect('/security');
  return (
    <AuthShell title={copy.consent}>
      <ConsentForm name={client.name ?? client.clientId} scopes={scopes} />
    </AuthShell>
  );
}
