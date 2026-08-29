'use client';

import { Button, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';

interface TokenRevealProps {
  token: string;
}

/**
 * Renders masked reveal and copy controls for the protected MCP credential.
 *
 * @param props - Server-provided MCP token available to the authenticated user.
 * @returns A read-only credential field with reveal, hide, and copy actions.
 */
export function TokenReveal({ token }: TokenRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [didCopy, setDidCopy] = useState(false);

  /** Copies the token and exposes short, screen-reader-readable feedback. */
  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(token);
    setDidCopy(true);
  }

  return (
    <div className="rounded-2xl bg-surface-secondary p-4 sm:p-5">
      <TextField isReadOnly value={token}>
        <Label>MCP token</Label>
        <Input type={isRevealed ? 'text' : 'password'} />
      </TextField>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setIsRevealed((current) => !current)}
        >
          {isRevealed ? 'Hide token' : 'Reveal token'}
        </Button>
        <Button size="sm" variant="ghost" onPress={() => void handleCopy()}>
          {didCopy ? 'Copied' : 'Copy token'}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {didCopy ? 'MCP token copied.' : ''}
      </p>
    </div>
  );
}
