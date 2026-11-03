import { redirect } from 'next/navigation';
import { LoginForm } from '@/app/(auth)/login/login-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { getSession } from '@/lib/auth/session';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { authCopy } from '@/components/auth/copy';

/** Renders the credential gateway or resumes the owner's protected session. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getSession();
  if (session && !(await searchParams).client_id)
    redirect(session.user.twoFactorEnabled ? '/' : '/security');
  const language = await getCurrentLanguage();
  return (
    <AuthShell title={authCopy[language].login}>
      <LoginForm />
    </AuthShell>
  );
}
