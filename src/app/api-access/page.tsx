import {
  ApiNavigation,
  ApiDocsLink,
} from '@/components/api-access/api-navigation';
import { requireAuthenticated } from '@/lib/auth/session';
import { listApiTokens } from '@/lib/api-tokens/store';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { apiCopy } from '@/components/api-access/copy';
import { TokenManager } from '@/components/api-access/token-manager';

export const dynamic = 'force-dynamic';

/** Renders owner-only credential management and practical API connection guidance. */
export default async function ApiAccessPage() {
  await requireAuthenticated();
  const [language, tokens] = await Promise.all([
    getCurrentLanguage(),
    listApiTokens(),
  ]);
  const copy = apiCopy[language];
  const summaries = tokens.map((token) => ({
    ...token,
    createdAt: token.createdAt.toISOString(),
    lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
    revokedAt: token.revokedAt?.toISOString() ?? null,
  }));
  return (
    <main className="mx-auto min-h-dvh [--field-background:var(--surface-secondary)] [--field-foreground:var(--foreground)] [--field-placeholder:var(--muted)] [--field-border:var(--divider)] [--field-hover:var(--surface-tertiary)] [--field-focus:var(--surface-secondary)] [--field-border-hover:var(--divider)] [--field-border-focus:var(--accent)] w-full max-w-6xl space-y-8 px-5 py-8 sm:px-8 sm:py-12">
      <ApiNavigation copy={copy} />
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="max-w-prose text-sm leading-6 text-muted">{copy.intro}</p>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section
          className="min-w-0 rounded-[20px] bg-surface p-5 sm:p-7"
          aria-label={copy.list}
        >
          <TokenManager tokens={summaries} />
        </section>
        <aside className="min-w-0 space-y-8 py-2">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{copy.referenceTitle}</h2>
            <p className="text-sm leading-6 text-muted">{copy.referenceHelp}</p>
            <pre
              className="overflow-x-auto rounded-xl bg-surface-secondary p-4 font-mono text-xs leading-6"
              tabIndex={0}
              aria-label="curl"
            >{`curl 'https://tasks.alejandrofernandezcamello.me/api/v1/tasks?limit=50' -H 'Authorization: Bearer YOUR_TOKEN'`}</pre>
            <ApiDocsLink label={copy.docs} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{copy.limits}</h2>
            <ul className="space-y-2 text-sm">
              <li>{copy.budget}</li>
              <li>{copy.writes}</li>
              <li>{copy.global}</li>
            </ul>
            <p className="text-sm leading-6 text-muted">{copy.limitsHelp}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
