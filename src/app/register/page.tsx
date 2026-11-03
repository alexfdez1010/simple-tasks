import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegistrationForm } from '@/components/auth/registration-form';
import { registrationCopy } from '@/components/auth/registration-copy';
import { AppLink } from '@/components/app-link';
import { isOwnerRegistrationOpen } from '@/lib/auth/registration-status';
import { getCurrentLanguage } from '@/lib/i18n/server';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export const dynamic = 'force-dynamic';

/** Shows the invite-only signup form while the unique owner slot is empty; closes immediately after creation. */
export default async function RegistrationPage() {
  const copy = registrationCopy[await getCurrentLanguage()];
  const open = await isOwnerRegistrationOpen();
  return (
    <AuthShell title={open ? copy.title : copy.closed}>
      {open ? (
        <RegistrationForm />
      ) : (
        <AppLink href="/login">{copy.login}</AppLink>
      )}
    </AuthShell>
  );
}
