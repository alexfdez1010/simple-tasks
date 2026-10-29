import { redirect } from 'next/navigation';

import { LoginForm } from '@/app/(auth)/login/login-form';
import { AppLogo } from '@/components/app-logo';
import { isAuthenticated } from '@/lib/auth/session';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/translations';
import './login.css';

/**
 * Renders the localized password gateway, redirecting authenticated visitors.
 * @returns The existing password form within the shared mineral visual system.
 */
export default async function LoginPage(): Promise<React.JSX.Element> {
  if (await isAuthenticated()) redirect('/');
  const language = await getCurrentLanguage();
  return (
    <main className="login-page">
      <header className="login-brand">
        <AppLogo className="size-10" />
        <span>{translate(language, 'auth.brand')}</span>
      </header>
      <section className="login-surface">
        <div className="login-heading">
          <h1>{translate(language, 'auth.heading')}</h1>
          <p>{translate(language, 'auth.instruction')}</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
