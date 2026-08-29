import { DownloadButtons } from '@/app/(auth)/skill/download-buttons';
import { MCP_CLIENT_TOKEN_ENV } from '@/lib/mcp/skill';

/** Renders concise setup instructions for connecting an AI agent. */
export default function SkillPage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-5 py-16">
      <section className="w-full space-y-8 rounded-3xl border border-border bg-surface p-7 sm:p-10">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted">Integración con IA</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Conecta Simple Tasks
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Descarga el skill y la configuración. En el entorno de tu agente,
            define{' '}
            <code className="rounded bg-default px-1.5 py-0.5">
              {MCP_CLIENT_TOKEN_ENV}
            </code>{' '}
            con el mismo valor que{' '}
            <code className="rounded bg-default px-1.5 py-0.5">MCP_TOKEN</code>{' '}
            en el servidor.
          </p>
        </div>
        <DownloadButtons />
      </section>
    </main>
  );
}
