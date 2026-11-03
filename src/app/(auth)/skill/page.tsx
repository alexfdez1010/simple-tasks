import { AppLink } from '@/components/app-link';
import { DownloadButtons } from '@/app/(auth)/skill/download-buttons';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { AuthShell } from '@/components/auth/auth-shell';
import { getAuthConfig } from '@/lib/auth/config';

/** Provides OAuth setup without rendering a reusable shared secret. */
export default async function SkillPage() {
  const es = (await getCurrentLanguage()) === 'es';
  return (
    <AuthShell title={es ? 'Conectar un agente' : 'Connect an agent'}>
      <div className="space-y-6">
        <p className="break-all rounded-lg bg-default p-3 font-mono text-sm">
          {getAuthConfig().baseURL}/api/mcp/mcp
        </p>
        <p className="text-sm text-muted">
          {es
            ? 'Conecta con OAuth, inicia sesión con tu autenticador y elige Solo lectura o Acceso completo.'
            : 'Connect with OAuth, sign in with your authenticator and choose Read only or Full access.'}
        </p>
        <DownloadButtons />
        <AppLink href="/security">
          {es
            ? 'Gestionar seguridad y conexiones'
            : 'Manage security and connections'}
        </AppLink>
        <AppLink href="/">{es ? 'Volver al tablero' : 'Back to board'}</AppLink>
      </div>
    </AuthShell>
  );
}
