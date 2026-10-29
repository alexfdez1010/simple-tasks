'use client';

import { Link } from '@heroui/react';
import { connectionsCopy } from '@/components/connections/copy';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';
import type { Language } from '@/lib/i18n/config';
import './connections.css';

/**
 * Presents the supported MCP and REST setup paths with their real instructions.
 * @param props - Persisted interface language; no connection health is inferred.
 * @returns A responsive setup overview linking to protected credential surfaces.
 */
export function ConnectionsContent({ language }: { language: Language }) {
  const copy = connectionsCopy[language];
  return (
    <main className="connections-page">
      <Link className="connections-back" href="/">
        <WorkspaceIcon name="arrow" className="size-4 rotate-180" />
        {copy.back}
      </Link>
      <header className="connections-heading">
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      <div className="connections-paths">
        {copy.entries.map((entry, index) => (
          <section className="connections-path" key={entry.href}>
            <div className="connections-path-heading">
              <h2 className="flex items-center gap-3">
                <WorkspaceIcon
                  name={index === 0 ? 'people' : 'connections'}
                  className="size-5 text-accent"
                />
                {entry.title}
              </h2>
              <p>{entry.description}</p>
            </div>
            <div className="connections-path-setup">
              <ol className="connections-steps">
                {entry.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Link className="connections-action" href={entry.href}>
                {entry.action}
                <WorkspaceIcon name="arrow" className="size-4" />
              </Link>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
