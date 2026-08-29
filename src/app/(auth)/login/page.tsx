import { redirect } from 'next/navigation';

import { LoginForm } from '@/app/(auth)/login/login-form';
import { isAuthenticated } from '@/lib/auth/session';

/** Renders the minimal password gateway for unauthenticated visitors. */
export default async function LoginPage(): Promise<React.JSX.Element> {
  if (await isAuthenticated()) redirect('/');
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 text-foreground">
      <section className="w-full max-w-sm rounded-3xl border border-border bg-surface p-7 shadow-sm sm:p-9">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium text-muted">Simple Tasks</p>
          <h1 className="text-2xl font-semibold tracking-tight">Your board</h1>
          <p className="text-sm leading-6 text-muted">
            Enter the password to continue.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
