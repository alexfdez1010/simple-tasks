'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/provider';
import { apiCopy } from '@/components/api-access/copy';
import { TokenForm } from '@/components/api-access/token-form';
import { TokenList } from '@/components/api-access/token-list';
import { TokenSecret } from '@/components/api-access/token-secret';
import type { TokenSummary } from '@/components/api-access/types';
import {
  createApiTokenAction,
  revokeApiTokenAction,
} from '@/lib/api-tokens/actions';

/** Owns transient secret state and session-authenticated mutations; secrets never enter browser storage. */
export function TokenManager({ tokens }: { tokens: TokenSummary[] }) {
  const { language, locale } = useI18n();
  const copy = apiCopy[language];
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  /** Creates one credential; exposes the returned secret only in the current component state. */
  async function create(name: string, canWrite: boolean): Promise<boolean> {
    setPending(true);
    setError('');
    setNotice('');
    try {
      const result = await createApiTokenAction({ name, canWrite });
      if (!result.success) {
        setError(
          result.error.startsWith('Revoke') ? copy.limitError : copy.error,
        );
        return false;
      }
      setSecret(result.data.token);
      router.refresh();
      return true;
    } catch {
      setError(copy.error);
      return false;
    } finally {
      setPending(false);
    }
  }
  /** Revokes one credential and refreshes non-secret metadata; failures remain actionable. */
  async function revoke(id: string): Promise<boolean> {
    setError('');
    setNotice('');
    try {
      const result = await revokeApiTokenAction(id);
      if (!result.success) {
        setError(copy.error);
        return false;
      }
      setNotice(copy.revokedNotice);
      router.refresh();
      return true;
    } catch {
      setError(copy.error);
      return false;
    }
  }
  return (
    <div className="space-y-8">
      {secret ? (
        <TokenSecret
          token={secret}
          copy={copy}
          onDismiss={() => setSecret(null)}
        />
      ) : (
        <TokenForm copy={copy} pending={pending} onCreate={create} />
      )}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <p className="text-sm text-accent" role="status">
        {notice}
      </p>
      <TokenList
        tokens={tokens}
        copy={copy}
        locale={locale}
        onRevoke={revoke}
      />
    </div>
  );
}
