'use client';

import { getStatisticsCopy } from '@/components/statistics/copy';
import { formatStatisticValue } from '@/components/statistics/statistic-format';
import { useI18n } from '@/lib/i18n/provider';
import type {
  StatisticChartResult,
  StatisticDefinition,
  StatisticSeriesValue,
} from '@/lib/statistics/types';

interface DisplaySeriesValue extends StatisticSeriesValue {
  color: string;
  displayLabel: string;
  plottedValue: number;
}

interface StatisticChartLegendProps {
  data: DisplaySeriesValue[];
  definition: Pick<StatisticDefinition, 'name'>;
  result: StatisticChartResult;
}

/** Renders exact chart values and shares as a keyboard-readable text list. */
export function StatisticChartLegend({
  data,
  definition,
  result,
}: StatisticChartLegendProps): React.JSX.Element {
  const { language, locale } = useI18n();
  const percentage = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  });
  return (
    <>
      <ul className="statistics-legend" aria-label={definition.name}>
        {data.map((entry) => (
          <li key={entry.displayLabel}>
            <span
              aria-hidden="true"
              className="statistics-legend-dot"
              style={{ background: entry.color }}
            />
            <span
              className="statistics-legend-label"
              title={entry.displayLabel}
            >
              {entry.displayLabel}
            </span>
            <strong>
              {formatStatisticValue(
                entry.value,
                result.format,
                locale,
                language,
              )}
            </strong>
            <span className="statistics-legend-share">
              <span className="statistics-share-track" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.min(100, Math.max(0, entry.percentage))}%`,
                    background: entry.color,
                  }}
                />
              </span>
              {getStatisticsCopy(language, 'filteredShare', {
                percentage: percentage.format(entry.percentage),
              })}
            </span>
          </li>
        ))}
      </ul>
      {result.multiValue ? (
        <p className="statistics-property-note">
          {getStatisticsCopy(language, 'multiValueNote')}
        </p>
      ) : null}
    </>
  );
}
