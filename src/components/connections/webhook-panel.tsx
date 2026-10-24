'use client';

import {
  Button,
  Description,
  Input,
  Label,
  Link,
  Switch,
  TextField,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { webhookCopy } from '@/components/connections/webhook-copy';
import { WebhookHistory } from '@/components/connections/webhook-history';
import { WebhookSecret } from '@/components/connections/webhook-secret';
import { saveWebhookAction, testWebhookAction } from '@/lib/webhooks/actions';
import type { readWebhookSettings } from '@/lib/webhooks/store';
import type { Language } from '@/lib/i18n/config';

export type WebhookSettings = Awaited<ReturnType<typeof readWebhookSettings>>;
interface WebhookPanelProps {
  settings: WebhookSettings;
  language: Language;
}

/** Configures one destination for all task events, retaining URL drafts and reporting real delivery results. */
export function WebhookPanel({ settings, language }: WebhookPanelProps) {
  const copy = webhookCopy[language];
  const router = useRouter();
  const [url, setUrl] = useState(settings.endpoint?.url ?? '');
  const [enabled, setEnabled] = useState(settings.endpoint?.enabled ?? true);
  const [pending, setPending] = useState<'save' | 'test' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const dirty =
    url.trim() !== settings.endpoint?.url ||
    enabled !== settings.endpoint?.enabled;

  /** Saves explicitly; an unsuccessful request preserves every draft value for correction. */
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending('save');
    setMessage('');
    setError(false);
    try {
      const result = await saveWebhookAction({ url, enabled });
      setError(!result.success);
      setMessage(result.success ? copy.saved : copy.saveError);
      if (result.success) router.refresh();
    } catch {
      setError(true);
      setMessage(copy.saveError);
    } finally {
      setPending(null);
    }
  }

  /** Sends a marked test only for persisted enabled settings and refreshes the authoritative history. */
  async function test() {
    if (pending) return;
    setPending('test');
    setMessage('');
    setError(false);
    try {
      const result = await testWebhookAction();
      setError(!result.success);
      setMessage(result.success ? copy.testDone : copy.testError);
      router.refresh();
    } catch {
      setError(true);
      setMessage(copy.testError);
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="py-7" aria-labelledby="webhook-title">
      <h2 id="webhook-title" className="text-lg font-semibold">
        {copy.title}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{copy.intro}</p>
      <form className="mt-5 space-y-5" onSubmit={save}>
        <TextField
          isRequired
          isDisabled={pending !== null}
          value={url}
          onChange={setUrl}
          type="url"
        >
          <Label>{copy.url}</Label>
          <Input className="text-base" maxLength={2048} autoComplete="url" />
          <Description>{copy.hint}</Description>
        </TextField>
        <Switch
          className="min-h-11"
          isSelected={enabled}
          onChange={setEnabled}
          isDisabled={pending !== null}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Content>
            <Label>{copy.enabled}</Label>
          </Switch.Content>
        </Switch>
        <div className="flex flex-wrap gap-2">
          <Button
            className="min-h-11"
            type="submit"
            isPending={pending === 'save'}
            isDisabled={pending !== null || !dirty}
          >
            {copy.save}
          </Button>
          <Button
            className="min-h-11"
            variant="secondary"
            isPending={pending === 'test'}
            isDisabled={
              pending !== null || dirty || !settings.endpoint?.enabled
            }
            onPress={test}
          >
            {copy.test}
          </Button>
        </div>
      </form>
      {message ? (
        <p
          className={`mt-3 text-sm ${error ? 'text-danger' : ''}`}
          role={error ? 'alert' : 'status'}
        >
          {message}
        </p>
      ) : null}
      {settings.endpoint ? (
        <WebhookSecret copy={copy} disabled={pending !== null} />
      ) : null}
      <WebhookHistory
        deliveries={settings.deliveries}
        copy={copy}
        enabled={Boolean(settings.endpoint?.enabled) && pending === null}
      />
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
        {copy.retryHint}
      </p>
      <Link
        className="mt-2 inline-flex min-h-11 items-center text-foreground underline underline-offset-4"
        href="/webhook-docs"
      >
        {copy.docs}
      </Link>
    </section>
  );
}
