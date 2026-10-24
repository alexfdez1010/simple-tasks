'use client';

import { Button, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { revealWebhookSecretAction } from '@/lib/webhooks/actions';
import type { webhookCopy } from '@/components/connections/webhook-copy';

interface WebhookSecretProps {
  copy: typeof webhookCopy.en;
  disabled: boolean;
}

/** Reveals an authenticated database-backed signing secret only on demand, with clipboard feedback. */
export function WebhookSecret({ copy, disabled }: WebhookSecretProps) {
  const [secret, setSecret] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  /** Fetches the secret on first reveal; subsequent toggles never fetch or mutate credentials. */
  async function reveal() {
    if (secret) {
      setVisible(!visible);
      return;
    }
    setPending(true);
    setMessage('');
    try {
      const result = await revealWebhookSecretAction();
      if (result.success) {
        setSecret(result.secret);
        setVisible(true);
      } else setMessage(copy.secretError);
    } catch {
      setMessage(copy.secretError);
    } finally {
      setPending(false);
    }
  }
  /** Copies only an explicitly revealed secret, retaining a manual selection fallback on failure. */
  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      setMessage(copy.copied);
    } catch {
      setMessage(copy.clipboardError);
    }
  }
  return (
    <div className="mt-6 space-y-2">
      <TextField isReadOnly>
        <Label>{copy.secret}</Label>
        <Input
          className="min-w-0 font-mono text-base"
          type={visible ? 'text' : 'password'}
          value={secret || '••••••••••••••••'}
        />
      </TextField>
      <p className="text-sm leading-6 text-muted">{copy.secretHint}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          className="min-h-11"
          variant="ghost"
          isDisabled={disabled}
          isPending={pending}
          onPress={reveal}
        >
          {visible ? copy.hide : copy.reveal}
        </Button>
        {secret ? (
          <Button className="min-h-11" variant="ghost" onPress={copySecret}>
            {copy.copy}
          </Button>
        ) : null}
      </div>
      <p className="text-sm" role="status">
        {message}
      </p>
    </div>
  );
}
