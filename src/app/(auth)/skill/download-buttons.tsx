'use client';

import { Link } from '@heroui/react';
import { useI18n } from '@/lib/i18n/provider';

/** Renders accessible downloads for the generated skill and MCP configuration. */
export function DownloadButtons(): React.JSX.Element {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        className="button button--primary"
        download
        href="/api/skill?kind=skill"
      >
        {t('ai.downloadSkill')}
      </Link>
      <Link
        className="button button--secondary"
        download
        href="/api/skill?kind=config"
      >
        {t('ai.downloadConfig')}
      </Link>
    </div>
  );
}
