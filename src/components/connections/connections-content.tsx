'use client';

import {
  WebhookPanel,
  type WebhookSettings,
} from '@/components/connections/webhook-panel';
import { Link } from '@heroui/react';
import { connectionsCopy } from '@/components/connections/copy';
import type { Language } from '@/lib/i18n/config';

/** Explains the two integration paths without claiming unverified connection health. */
export function ConnectionsContent({
  language,
  webhook,
}: {
  language: Language;
  webhook: WebhookSettings;
}) {
  const copy = connectionsCopy[language];
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-8 text-foreground sm:py-16">
      <Link className="inline-flex min-h-11 items-center" href="/">
        {copy.back}
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-muted">
        {copy.intro}
      </p>
      <div className="mt-10 divide-y divide-divider">
        <WebhookPanel settings={webhook} language={language} />
        {copy.entries.map((entry) => (
          <section className="py-7 first:pt-0" key={entry.href}>
            <h2 className="text-lg font-semibold">{entry.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              {entry.description}
            </p>
            <ol className="my-4 list-inside list-decimal space-y-2 text-sm leading-6">
              {entry.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <Link
              className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4"
              href={entry.href}
            >
              {entry.action}
            </Link>
          </section>
        ))}
      </div>
    </main>
  );
}
