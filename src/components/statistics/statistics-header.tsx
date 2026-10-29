'use client';

import { Button, Link } from '@heroui/react';
import { AppLogo } from '@/components/app-logo';

import { getStatisticsCopy } from '@/components/statistics/copy';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';
import { useI18n } from '@/lib/i18n/provider';

interface StatisticsHeaderProps {
  widgetCount: number;
  isFocused: boolean;
  onCreate: () => void;
  onToggleFocus: () => void;
}

/**
 * Presents the statistics title, actual widget count and canvas controls.
 * @param props - Persisted widget count and session-owned focus/create actions.
 * @returns Localized navigation and actions; an empty canvas remains usable.
 */
export function StatisticsHeader({
  widgetCount,
  isFocused,
  onCreate,
  onToggleFocus,
}: StatisticsHeaderProps): React.JSX.Element {
  const { language, locale } = useI18n();
  return (
    <header className="statistics-header-wrap">
      <div className="statistics-header">
        <Link className="statistics-back-link" href="/">
          <WorkspaceIcon name="arrow" className="size-4 rotate-180" />
          {getStatisticsCopy(language, 'backToBoard')}
        </Link>
        <div className="statistics-heading-row">
          <div className="statistics-heading-group">
            <h1 className="flex items-center gap-3">
              <AppLogo className="size-10 shrink-0" />
              {getStatisticsCopy(language, 'heading')}
            </h1>
            <p>{getStatisticsCopy(language, 'subtitle')}</p>
            <span className="statistics-count">
              <WorkspaceIcon name="chart" className="size-3.5" />
              {getStatisticsCopy(language, 'widgetsConfigured', {
                count: new Intl.NumberFormat(locale).format(widgetCount),
              })}
            </span>
          </div>
          <div className="statistics-header-actions">
            <Button
              variant="secondary"
              aria-pressed={isFocused}
              onPress={onToggleFocus}
            >
              <WorkspaceIcon name="fit" className="size-4" />
              {getStatisticsCopy(language, 'focusView')}
            </Button>
            <Button onPress={onCreate}>
              <WorkspaceIcon name="plus" className="size-4" />
              {getStatisticsCopy(language, 'addStatistic')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
