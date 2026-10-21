'use client';
import { Button, Input, Label, TextField } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import type { ApiCopy } from '@/components/api-access/copy';

/** Reveals a newly created secret once, focuses it, and reports clipboard failures without losing it. */
export function TokenSecret({
  token,
  copy,
  onDismiss,
}: {
  token: string;
  copy: ApiCopy;
  onDismiss: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    input.current?.focus();
  }, []);

  /** Copies the credential on explicit request; manual selection remains available on failure. */
  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token);
      setFeedback(copy.copied);
    } catch {
      setFeedback(copy.clipboardError);
      input.current?.select();
    }
  }
  return (
    <section
      aria-label={copy.secretTitle}
      className="space-y-4 rounded-2xl bg-accent-soft p-5 text-accent-soft-foreground"
    >
      <h2 className="text-lg font-semibold">{copy.secretTitle}</h2>
      <p className="max-w-prose text-sm leading-6">{copy.secretHelp}</p>
      <TextField isReadOnly>
        <Label>{copy.secret}</Label>
        <Input
          ref={input}
          className="min-h-11 font-mono text-sm"
          value={token}
          autoComplete="off"
          spellCheck={false}
        />
      </TextField>
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11" onPress={() => void copyToken()}>
          {copy.copy}
        </Button>
        <Button className="min-h-11" variant="secondary" onPress={onDismiss}>
          {copy.dismiss}
        </Button>
      </div>
      <p className="text-sm" role="status">
        {feedback}
      </p>
    </section>
  );
}
