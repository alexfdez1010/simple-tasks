'use client';

import { Button, Link } from '@heroui/react';
import Image from 'next/image';

import appIcon from '@/app/icon.png';
import { getStatisticsCopy } from '@/components/statistics/copy';
import { useI18n } from '@/lib/i18n/provider';

interface StatisticsHeaderProps {
  widgetCount: number;
  isFocused: boolean;
  onCreate: () => void;
  onToggleFocus: () => void;
}

/**
 * Displays navigation and session-local focus controls, including an empty canvas.
 * @param props - Widget count, focus state, and callbacks owned by the dashboard.
 * @returns A localized header; pressing controls invokes the supplied callbacks.
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
        <div className="statistics-heading-group">
          <Image
            alt=""
            aria-hidden="true"
            className="statistics-mark"
            priority
            sizes="48px"
            src={appIcon}
          />
          <div>
            <h1>{getStatisticsCopy(language, 'heading')}</h1>
            <p>{getStatisticsCopy(language, 'subtitle')}</p>
            <span className="statistics-count">
              {getStatisticsCopy(language, 'widgetsConfigured', {
                count: new Intl.NumberFormat(locale).format(widgetCount),
              })}
            </span>
          </div>
        </div>
        <div className="statistics-header-actions">
          <Button
            variant="secondary"
            aria-pressed={isFocused}
            onPress={onToggleFocus}
          >
            {getStatisticsCopy(language, 'focusView')}
          </Button>
          <Link className="statistics-back-link" href="/">
            <span aria-hidden="true">←</span>
            {getStatisticsCopy(language, 'backToBoard')}
          </Link>
          <Button onPress={() => onCreate()}>
            <span aria-hidden="true">＋</span>
            {getStatisticsCopy(language, 'addStatistic')}
          </Button>
        </div>
      </div>
    </header>
  );
}
