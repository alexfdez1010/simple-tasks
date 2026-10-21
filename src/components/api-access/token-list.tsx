'use client';
import { ConfirmationDialog } from '@/components/board/confirmation-dialog';
import type { ApiCopy } from '@/components/api-access/copy';
import type { TokenSummary } from '@/components/api-access/types';

/** Renders identifying hints and usage metadata without ever receiving saved credential hashes. */
export function TokenList({
  tokens,
  copy,
  locale,
  onRevoke,
}: {
  tokens: TokenSummary[];
  copy: ApiCopy;
  locale: string;
  onRevoke: (id: string) => Promise<boolean>;
}) {
  const format = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  return (
    <section className="space-y-5" aria-labelledby="tokens-heading">
      <h2 id="tokens-heading" className="text-lg font-semibold">
        {copy.list}
      </h2>
      {tokens.length === 0 ? (
        <p className="py-6 text-sm leading-6 text-muted">{copy.empty}</p>
      ) : (
        <ul className="divide-y divide-divider">
          {tokens.map((token) => (
            <li
              key={token.id}
              className="flex flex-wrap items-start justify-between gap-4 py-5 first:pt-0"
            >
              <div className="min-w-0 flex-1 basis-56 space-y-2">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="break-all font-medium">{token.name}</span>
                  <span
                    className={`text-xs font-medium ${token.revokedAt ? 'text-muted' : 'text-accent'}`}
                  >
                    {token.revokedAt ? copy.revoked : copy.active}
                  </span>
                </p>
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                  <code className="break-all text-foreground">
                    {token.hint}
                  </code>
                  <span>{token.canWrite ? copy.write : copy.read}</span>
                </p>
                <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs leading-5 text-muted">
                  <div className="flex gap-1">
                    <dt>{copy.created}:</dt>
                    <dd>
                      <time dateTime={token.createdAt}>
                        {format.format(new Date(token.createdAt))}
                      </time>
                    </dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>{copy.lastUsed}:</dt>
                    <dd>
                      {token.lastUsedAt ? (
                        <time dateTime={token.lastUsedAt}>
                          {format.format(new Date(token.lastUsedAt))}
                        </time>
                      ) : (
                        copy.never
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
              {!token.revokedAt && (
                <ConfirmationDialog
                  buttonClassName="min-h-11"
                  dialogClassName="bg-surface text-foreground"
                  triggerLabel={copy.revoke}
                  triggerAriaLabel={`${copy.revoke}: ${token.name}`}
                  triggerVariant="ghost"
                  heading={copy.revokeHeading}
                  body={copy.revokeBody}
                  confirmLabel={copy.revoke}
                  onConfirm={() => onRevoke(token.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
