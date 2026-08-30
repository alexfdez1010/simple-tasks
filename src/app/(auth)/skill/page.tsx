import { DownloadButtons } from '@/app/(auth)/skill/download-buttons';
import { TokenReveal } from '@/app/(auth)/skill/token-reveal';
import { getMcpToken } from '@/lib/mcp/config';
import { MCP_CLIENT_TOKEN_ENV } from '@/lib/mcp/skill';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/translations';
import Link from 'next/link';

/** Prevents the MCP credential from entering static build output or caches. */
export const dynamic = 'force-dynamic';

/** Renders concise setup instructions for connecting an AI agent. */
export default async function SkillPage(): Promise<React.JSX.Element> {
  const language = await getCurrentLanguage();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-5 py-16">
      <section className="w-full space-y-8 rounded-3xl border border-border bg-surface p-7 sm:p-10">
        <Link className="link inline-flex" href="/">
          {translate(language, 'ai.backToBoard')}
        </Link>
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted">
            {translate(language, 'ai.integration')}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {translate(language, 'ai.heading')}
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted">
            {translate(language, 'ai.instructions', {
              clientEnv: MCP_CLIENT_TOKEN_ENV,
              serverEnv: 'MCP_TOKEN',
            })}
          </p>
        </div>
        <TokenReveal token={getMcpToken()} />
        <DownloadButtons />
      </section>
    </main>
  );
}
