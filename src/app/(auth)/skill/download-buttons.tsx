'use client';

import { Link } from '@heroui/react';

/** Renders accessible downloads for the generated skill and MCP configuration. */
export function DownloadButtons(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        className="button button--primary"
        download
        href="/api/skill?kind=skill"
      >
        Download SKILL.md
      </Link>
      <Link
        className="button button--secondary"
        download
        href="/api/skill?kind=config"
      >
        Download MCP configuration
      </Link>
    </div>
  );
}
