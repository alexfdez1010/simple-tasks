'use client';
import { Button } from '@heroui/react';
import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { authCopy } from '@/components/auth/copy';
import { useI18n } from '@/lib/i18n/provider';

/** Lets an owner restart enrollment or end a session from the security screen. */
export function SignOutButton() {
  const { language } = useI18n();
  const copy = authCopy[language];
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  /** Clears the Better Auth session before returning to the public gateway. */
  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(true);
        return;
      }
      window.location.assign(new URL('/login', window.location.origin).href);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="mt-5">
      <Button variant="tertiary" isPending={pending} onPress={signOut}>
        {copy.logout}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {copy.invalid}
        </p>
      ) : null}
    </div>
  );
}
