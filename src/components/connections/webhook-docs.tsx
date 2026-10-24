'use client';

import { Link } from '@heroui/react';
import { webhookDocsCopy } from '@/components/connections/webhook-docs-copy';
import {
  webhookDispatchExample,
  webhookPayloadExample,
  webhookVerificationExample,
} from '@/components/connections/webhook-examples';
import type { Language } from '@/lib/i18n/config';

const events = [
  'task.created',
  'task.updated',
  'task.moved',
  'task.deleted',
  'webhook.test',
];

/** Presents the versioned task-event contract, signature verification and honest retry/deployment semantics. */
export function WebhookDocs({ language }: { language: Language }) {
  const c = webhookDocsCopy[language];
  return (
    <main className="mx-auto min-h-dvh max-w-4xl space-y-8 px-5 py-8 text-foreground sm:py-12">
      <Link className="inline-flex min-h-11 items-center" href="/connections">
        {c.back}
      </Link>
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{c.title}</h1>
        <p className="max-w-prose leading-7 text-muted">{c.intro}</p>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.setup}</h2>
        <ol className="list-inside list-decimal space-y-2 text-sm leading-7">
          {c.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.events}</h2>
        <dl className="divide-y divide-divider">
          {events.map((event, i) => (
            <div
              className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]"
              key={event}
            >
              <dt className="font-mono text-sm">{event}</dt>
              <dd className="text-sm leading-6 text-muted">{c.meanings[i]}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.payload}</h2>
        <p className="max-w-prose text-sm leading-7 text-muted">
          {c.payloadHelp}
        </p>
        <pre
          className="overflow-x-auto rounded-xl bg-surface-secondary p-4 text-xs leading-6"
          tabIndex={0}
          aria-label={c.payload}
        >
          <code>{webhookPayloadExample}</code>
        </pre>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.signatures}</h2>
        <p className="max-w-prose text-sm leading-7 text-muted">
          {c.signatureHelp}
        </p>
        <pre
          className="overflow-x-auto rounded-xl bg-surface-secondary p-4 text-xs leading-6"
          tabIndex={0}
          aria-label={c.signatures}
        >
          <code>{webhookVerificationExample}</code>
        </pre>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.delivery}</h2>
        <p className="max-w-prose text-sm leading-7 text-muted">
          {c.deliveryHelp}
        </p>
        <p className="max-w-prose text-sm leading-7 text-muted">
          {c.retryHelp}
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.schedule}</h2>
        <p className="max-w-prose text-sm leading-7 text-muted">
          {c.scheduleHelp}
        </p>
        <pre
          className="overflow-x-auto rounded-xl bg-surface-secondary p-4 text-xs leading-6"
          tabIndex={0}
          aria-label="curl"
        >
          <code>{webhookDispatchExample}</code>
        </pre>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.controls}</h2>
        <p className="max-w-prose text-sm leading-7 text-muted">
          {c.controlsHelp}
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.limits}</h2>
        <p className="max-w-prose text-sm leading-7 text-muted">
          {c.limitsHelp}
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.scope}</h2>
        <p className="max-w-prose text-sm leading-7 text-muted">
          {c.scopeHelp}
        </p>
      </section>
    </main>
  );
}
