import { DownloadButtons } from '@/app/(auth)/skill/download-buttons';
import { TokenReveal } from '@/app/(auth)/skill/token-reveal';
import { getMcpToken } from '@/lib/mcp/config';
import { MCP_CLIENT_TOKEN_ENV } from '@/lib/mcp/skill';
import Link from 'next/link';

/** Prevents the MCP credential from entering static build output or caches. */
export const dynamic = 'force-dynamic';

/** Renders concise setup instructions for connecting an AI agent. */
export default function SkillPage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-5 py-16">
      <section className="w-full space-y-8 rounded-3xl border border-border bg-surface p-7 sm:p-10">
        <Link className="link inline-flex" href="/">
          Back to board
        </Link>
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted">AI integration</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Connect Simple Tasks
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Download the skill and configuration. In your agent environment, set{' '}
            <code className="rounded bg-default px-1.5 py-0.5">
              {MCP_CLIENT_TOKEN_ENV}
            </code>{' '}
            to the same value as{' '}
            <code className="rounded bg-default px-1.5 py-0.5">MCP_TOKEN</code>{' '}
            on the server.
          </p>
        </div>
        <TokenReveal token={getMcpToken()} />
        <DownloadButtons />
      </section>
    </main>
  );
}
