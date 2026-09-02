'use client';

import { Card, Link } from '@heroui/react';
import { useNumberFormatter } from '@react-aria/i18n';
import Image from 'next/image';

import appIcon from '@/app/icon.png';
import { getStatisticsCopy } from '@/components/statistics/copy';
import { formatResolutionDuration } from '@/components/statistics/duration';
import { PropertyStatisticCard } from '@/components/statistics/property-statistic-card';
import { useI18n } from '@/lib/i18n/provider';
import type { StatisticsSnapshot } from '@/lib/statistics/types';

interface StatisticsDashboardProps {
  snapshot: StatisticsSnapshot;
}

interface MetricCardProps {
  description: string;
  label: string;
  value: string;
}

/** Renders one high-level statistic with its measurement context. */
function MetricCard({
  description,
  label,
  value,
}: MetricCardProps): React.JSX.Element {
  return (
    <Card className="statistics-metric-card" variant="secondary">
      <Card.Header>
        <Card.Description>{label}</Card.Description>
      </Card.Header>
      <Card.Content>
        <p className="statistics-metric-value">{value}</p>
        <p className="statistics-metric-description">{description}</p>
      </Card.Content>
    </Card>
  );
}

/** Composes the localized statistics page from a serializable server snapshot. */
export function StatisticsDashboard({
  snapshot,
}: StatisticsDashboardProps): React.JSX.Element {
  const { language } = useI18n();
  const numberFormatter = useNumberFormatter();

  return (
    <div className="statistics-app min-h-dvh bg-background text-foreground">
      <a className="skip-link" href="#statistics-content">
        {getStatisticsCopy(language, 'skipToStatistics')}
      </a>
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
            </div>
          </div>
          <Link className="statistics-back-link" href="/">
            <span aria-hidden="true">←</span>
            {getStatisticsCopy(language, 'backToBoard')}
          </Link>
        </div>
      </header>

      <main id="statistics-content" className="statistics-main">
        <section
          className="statistics-metrics"
          aria-label={getStatisticsCopy(language, 'heading')}
        >
          <MetricCard
            description={getStatisticsCopy(language, 'averageDescription')}
            label={getStatisticsCopy(language, 'averageResolution')}
            value={formatResolutionDuration(
              snapshot.averageResolutionTimeMs,
              language,
            )}
          />
          <MetricCard
            description={getStatisticsCopy(language, 'completedDescription')}
            label={getStatisticsCopy(language, 'completedTasks')}
            value={numberFormatter.format(snapshot.completedTaskCount)}
          />
          <MetricCard
            description={getStatisticsCopy(language, 'propertyDescription')}
            label={getStatisticsCopy(language, 'propertyTracked')}
            value={numberFormatter.format(snapshot.properties.length)}
          />
        </section>

        {snapshot.completedTaskCount === 0 ? (
          <Card className="statistics-empty" variant="secondary">
            <Card.Header>
              <Card.Title>
                {getStatisticsCopy(language, 'emptyTitle')}
              </Card.Title>
              <Card.Description>
                {getStatisticsCopy(language, 'emptyDescription')}
              </Card.Description>
            </Card.Header>
          </Card>
        ) : (
          <section className="statistics-breakdowns">
            <div className="statistics-section-heading">
              <h2>{getStatisticsCopy(language, 'propertyBreakdowns')}</h2>
              <p>{getStatisticsCopy(language, 'propertyDescription')}</p>
            </div>
            {snapshot.properties.length === 0 ? (
              <Card className="statistics-empty" variant="secondary">
                <Card.Header>
                  <Card.Title>
                    {getStatisticsCopy(language, 'noPropertiesTitle')}
                  </Card.Title>
                  <Card.Description>
                    {getStatisticsCopy(language, 'noPropertiesDescription')}
                  </Card.Description>
                </Card.Header>
              </Card>
            ) : (
              <div className="statistics-property-grid">
                {snapshot.properties.map((statistic) => (
                  <PropertyStatisticCard
                    completedTaskCount={snapshot.completedTaskCount}
                    key={statistic.propertyId}
                    statistic={statistic}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
