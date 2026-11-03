'use client';
import { Button } from '@heroui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authCopy } from '@/components/auth/copy';
import { useI18n } from '@/lib/i18n/provider';

/** Shows granted permissions and revokes a selected connection without exposing credentials. */
export function GrantList({
  grants,
  revoke,
}: {
  grants: { id: string; name: string; scopes: string[] }[];
  revoke: (id: string) => Promise<void>;
}) {
  const { language } = useI18n();
  const copy = authCopy[language];
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState(false);
  /** Revokes the selected grant and refreshes its server-rendered metadata. */
  async function remove(id: string) {
    setPending(id);
    setError(false);
    try {
      await revoke(id);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(null);
    }
  }
  return (
    <div className="space-y-4">
      {grants.length ? (
        <ul className="space-y-5">
          {grants.map((grant) => (
            <li key={grant.id} className="space-y-2">
              <p className="break-all font-medium">{grant.name}</p>
              <p className="text-sm text-muted">
                {grant.scopes.includes('tasks:write') ? copy.full : copy.read}
              </p>
              <Button
                variant="secondary"
                isPending={pending === grant.id}
                isDisabled={pending !== null}
                onPress={() => remove(grant.id)}
              >
                {copy.revoke}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{copy.noGrants}</p>
      )}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {copy.invalid}
        </p>
      ) : null}
    </div>
  );
}
