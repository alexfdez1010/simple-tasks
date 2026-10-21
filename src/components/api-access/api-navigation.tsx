'use client';
import { Link } from '@heroui/react';
import type { ApiCopy } from '@/components/api-access/copy';

/** Keeps HeroUI navigation in a small client boundary while pages and docs remain server-rendered. */
export function ApiNavigation({
  copy,
  documentation = false,
}: {
  copy: ApiCopy;
  documentation?: boolean;
}) {
  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-4"
      aria-label={documentation ? copy.docs : copy.title}
    >
      <Link
        className="min-h-11 py-3 text-sm"
        href={documentation ? '/api-access' : '/'}
      >
        {documentation ? copy.title : copy.back}
      </Link>
      {documentation ? (
        <Link
          className="min-h-11 py-3 text-sm"
          href="/api/openapi"
          download="simple-tasks-openapi.json"
        >
          {copy.contract}
        </Link>
      ) : (
        <ApiDocsLink label={copy.docs} />
      )}
    </nav>
  );
}

/** Provides the shared documentation destination using the same accessible link primitive. */
export function ApiDocsLink({ label }: { label: string }) {
  return (
    <Link className="min-h-11 py-3 text-sm" href="/api-docs">
      {label}
    </Link>
  );
}
