'use client';

import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { readWebhookSettings } from '@/lib/webhooks/store';
import { retryWebhookAction } from '@/lib/webhooks/actions';
import type { webhookCopy } from '@/components/connections/webhook-copy';
import { useI18n } from '@/lib/i18n/provider';

interface WebhookHistoryProps {
  deliveries: Awaited<ReturnType<typeof readWebhookSettings>>['deliveries'];
  copy: typeof webhookCopy.en;
  enabled: boolean;
}

/** Lists exact recent delivery outcomes with a manual refresh and eligible retry, without exposing task data or URLs. */
export function WebhookHistory({
  deliveries,
  copy,
  enabled,
}: WebhookHistoryProps) {
  const router = useRouter();
  const { locale } = useI18n();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  /** Queues a failed/pending event again while guarding duplicate clicks. */
  async function retry(id: string) {
    setPending(id);
    setMessage('');
    try {
      const result = await retryWebhookAction(id);
      setMessage(result.success ? copy.retryDone : copy.retryError);
      if (result.success) router.refresh();
    } catch {
      setMessage(copy.retryError);
    } finally {
      setPending(null);
    }
  }
  return (
    <section className="mt-8" aria-label={copy.deliveries}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{copy.deliveries}</h3>
        <Button
          className="min-h-11"
          variant="ghost"
          onPress={() => router.refresh()}
        >
          {copy.refresh}
        </Button>
      </div>
      <p role="status" className="text-sm">
        {message}
      </p>
      {!deliveries.length ? (
        <p className="mt-3 text-sm leading-6 text-muted">{copy.empty}</p>
      ) : (
        <ul className="divide-y divide-divider">
          {deliveries.map((row) => (
            <li
              className="flex min-w-0 flex-wrap items-start justify-between gap-3 py-4"
              key={row.id}
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">
                  {copy.events[row.event as keyof typeof copy.events] ??
                    row.event}
                </p>
                <p className="text-sm text-muted">
                  {{
                    PENDING: copy.sending,
                    DELIVERED: copy.delivered,
                    FAILED: copy.failed,
                    CANCELLED: copy.cancelled,
                  }[row.state] ?? row.state}{' '}
                  · {row.attempts} {copy.attempts}
                  {row.responseCode
                    ? ` · HTTP ${row.responseCode}`
                    : row.error
                      ? ` · ${copy.noResponse}`
                      : ''}
                </p>
                <p className="text-xs text-muted">
                  <time dateTime={row.createdAt}>
                    {formatter.format(new Date(row.createdAt))}
                  </time>
                </p>
                {row.state === 'PENDING' && row.error ? (
                  <p className="text-xs text-muted">
                    {copy.next}: {formatter.format(new Date(row.nextAttemptAt))}
                  </p>
                ) : null}
                <p className="break-all font-mono text-xs text-muted">
                  {row.id}
                </p>
              </div>
              {enabled && row.canRetry ? (
                <Button
                  className="min-h-11"
                  size="sm"
                  variant="secondary"
                  isPending={pending === row.id}
                  isDisabled={pending !== null}
                  onPress={() => retry(row.id)}
                >
                  {copy.retry}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
