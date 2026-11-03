import { AppLogo } from '@/components/app-logo';
import '@/app/(auth)/login/login.css';

/** Reuses the accessible login layout for authentication and OAuth steps. */
export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="login-page">
      <header className="login-brand">
        <AppLogo className="size-10" />
        <span>Tasks</span>
      </header>
      <section className="login-surface">
        <div className="login-heading">
          <h1>{title}</h1>
        </div>
        {children}
      </section>
    </main>
  );
}
