'use client';

import { Button, Card } from '@heroui/react';

import { getStatisticsCopy } from '@/components/statistics/copy';
import { StatisticChart } from '@/components/statistics/statistic-chart';
import {
  formatStatisticValue,
  getStatisticDescription,
} from '@/components/statistics/statistic-format';
import { useI18n } from '@/lib/i18n/provider';
import type { StatisticWidgetResult } from '@/lib/statistics/types';

interface StatisticCardProps {
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  isPending: boolean;
  statistic: StatisticWidgetResult;
  onDelete: () => void;
  onEdit: () => void;
  onMove: (direction: -1 | 1) => void;
}

/** Renders one configurable KPI or chart with keyboard-accessible canvas controls. */
export function StatisticCard({
  canMoveEarlier,
  canMoveLater,
  isPending,
  statistic,
  onDelete,
  onEdit,
  onMove,
}: StatisticCardProps): React.JSX.Element {
  const { language, locale } = useI18n();
  const { definition, result } = statistic;
  return (
    <Card
      className={`statistics-widget ${result.kind === 'KPI' ? 'statistics-widget-kpi' : 'statistics-widget-chart'}`}
      variant={result.kind === 'KPI' ? 'tertiary' : 'secondary'}
    >
      <Card.Header className="statistics-widget-header">
        <div className="min-w-0">
          <Card.Title>{definition.name}</Card.Title>
          <Card.Description>
            {getStatisticDescription(definition, language)}
          </Card.Description>
        </div>
        <div
          className="statistics-widget-actions"
          aria-label={getStatisticsCopy(language, 'actions')}
        >
          <Button
            isIconOnly
            isDisabled={!canMoveEarlier || isPending}
            size="sm"
            variant="ghost"
            aria-label={getStatisticsCopy(language, 'moveEarlier', {
              name: definition.name,
            })}
            onPress={() => onMove(-1)}
          >
            <span aria-hidden="true">←</span>
          </Button>
          <Button
            isIconOnly
            isDisabled={!canMoveLater || isPending}
            size="sm"
            variant="ghost"
            aria-label={getStatisticsCopy(language, 'moveLater', {
              name: definition.name,
            })}
            onPress={() => onMove(1)}
          >
            <span aria-hidden="true">→</span>
          </Button>
          <Button
            isIconOnly
            isDisabled={isPending}
            size="sm"
            variant="ghost"
            aria-label={`${getStatisticsCopy(language, 'edit')}: ${definition.name}`}
            onPress={onEdit}
          >
            <span aria-hidden="true">✎</span>
          </Button>
          <Button
            isIconOnly
            isDisabled={isPending}
            size="sm"
            variant="ghost"
            aria-label={`${getStatisticsCopy(language, 'delete')}: ${definition.name}`}
            onPress={onDelete}
          >
            <span aria-hidden="true">×</span>
          </Button>
        </div>
      </Card.Header>
      <Card.Content className="statistics-widget-content">
        {result.kind === 'KPI' ? (
          <>
            <p
              className={`statistics-metric-value ${result.value === null ? 'statistics-metric-value-empty' : ''}`}
            >
              {formatStatisticValue(
                result.value,
                result.format,
                locale,
                language,
              )}
            </p>
            <p className="statistics-metric-description">
              {getStatisticsCopy(language, 'sample', {
                count: new Intl.NumberFormat(locale).format(result.sampleSize),
              })}
            </p>
          </>
        ) : (
          <StatisticChart definition={definition} result={result} />
        )}
      </Card.Content>
    </Card>
  );
}
