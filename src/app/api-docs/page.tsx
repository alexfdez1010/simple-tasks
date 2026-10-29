import { AppLogo } from '@/components/app-logo';
import { ApiNavigation } from '@/components/api-access/api-navigation';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { apiCopy } from '@/components/api-access/copy';
import { EndpointReference } from '@/components/api-access/endpoint-reference';

/** Presents a public, localized API guide with expandable request and response contracts. */
export default async function ApiDocsPage() {
  const language = await getCurrentLanguage();
  const copy = apiCopy[language];
  const sections = [
    [copy.authentication, copy.authHelp],
    [copy.pagination, copy.paginationHelp],
    [
      copy.limits,
      `${copy.budget}. ${copy.writes}. ${copy.global}. ${copy.limitsHelp}`,
    ],
    [copy.conventions, copy.conventionsHelp],
    [copy.behavior, copy.behaviorHelp],
    [copy.retry, copy.retryHelp],
  ];
  return (
    <main className="mx-auto min-h-dvh w-full max-w-4xl space-y-10 px-5 py-8 sm:px-8 sm:py-12">
      <ApiNavigation copy={copy} documentation />
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <AppLogo className="size-10 shrink-0" />
          {copy.docs}
        </h1>
        <p className="max-w-prose text-sm leading-6 text-muted">
          {copy.documentationIntro}
        </p>
        <code className="inline-block rounded-lg bg-surface-secondary px-3 py-2 text-sm">
          /api/v1
        </code>
      </header>
      <div className="max-w-prose space-y-8">
        {sections.map(([title, body]) => (
          <section key={title} className="space-y-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="break-words text-sm leading-7 text-muted">{body}</p>
          </section>
        ))}
      </div>
      <section className="space-y-3" aria-label={copy.referenceTitle}>
        <h2 className="text-lg font-semibold">{copy.referenceTitle}</h2>
        <pre
          className="overflow-x-auto rounded-xl bg-surface-secondary p-4 font-mono text-xs leading-6"
          tabIndex={0}
        >{`curl 'https://tasks.alejandrofernandezcamello.me/api/v1/tasks?limit=50&scope=active' -H 'Authorization: Bearer YOUR_TOKEN'`}</pre>
        <pre
          className="overflow-x-auto rounded-xl bg-surface-secondary p-4 font-mono text-xs leading-6"
          tabIndex={0}
        >
          {JSON.stringify(
            {
              data: [],
              pagination: { limit: 50, hasMore: false, nextCursor: null },
            },
            null,
            2,
          )}
        </pre>
      </section>
      <EndpointReference copy={copy} language={language} />
    </main>
  );
}
