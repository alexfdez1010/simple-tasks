import type { StatisticsCopyKey } from '@/components/statistics/copy';
import { getStatisticsCopy } from '@/components/statistics/copy';
import { getDateRangeLabel } from '@/components/statistics/date-range-copy';
import { formatResolutionDuration } from '@/components/statistics/duration';
import { MEASURES, SCOPES } from '@/components/statistics/statistic-options';
import {
  StatisticDateBucket,
  StatisticDateRange,
  StatisticGroupBy,
} from '@/generated/prisma';
import type { Language } from '@/lib/i18n/config';
import type {
  StatisticDefinition,
  StatisticValueFormat,
} from '@/lib/statistics/types';

/** Finds and localizes one enum-backed statistic option. */
function getOptionLabel(
  language: Language,
  key: string,
  options: Array<{ id: string; labelKey: StatisticsCopyKey }>,
): string {
  const option = options.find((candidate) => candidate.id === key);
  return option ? getStatisticsCopy(language, option.labelKey) : key;
}

/** Formats a calculated statistic using its semantic unit. */
export function formatStatisticValue(
  value: number | null,
  format: StatisticValueFormat,
  locale: string,
  language: Language,
): string {
  if (value === null) return getStatisticsCopy(language, 'notAvailable');
  if (format === 'DURATION') return formatResolutionDuration(value, language);
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return format === 'PERCENTAGE'
    ? `${formatter.format(value)}%`
    : formatter.format(value);
}

/** Formats category and ISO-like time-bucket labels for human display. */
export function formatSeriesLabel(
  label: string | null,
  definition: StatisticDefinition,
  locale: string,
  language: Language,
): string {
  if (label === null) return getStatisticsCopy(language, 'unassigned');
  if (label === '__OTHER__') return getStatisticsCopy(language, 'other');
  if (definition.groupBy !== StatisticGroupBy.DATE) return label;
  if (definition.dateBucket === StatisticDateBucket.QUARTER) {
    const [year, quarter] = label.split('-Q');
    return language === 'es' ? `T${quarter} ${year}` : `Q${quarter} ${year}`;
  }
  if (definition.dateBucket === StatisticDateBucket.YEAR) return label;
  const value = /^\d{4}-\d{2}$/.test(label) ? `${label}-01` : label;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return label;
  return new Intl.DateTimeFormat(locale, {
    day:
      definition.dateBucket === StatisticDateBucket.MONTH
        ? undefined
        : 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(date);
}

/** Builds a concise localized measure and scope description for a card. */
export function getStatisticDescription(
  definition: StatisticDefinition,
  language: Language,
): string {
  const measure = getOptionLabel(language, definition.measure, MEASURES);
  const scope = getOptionLabel(language, definition.scope, SCOPES);
  const parts = [measure, scope];
  if (definition.dateRange !== StatisticDateRange.ALL_TIME) {
    parts.push(getDateRangeLabel(language, definition.dateRange));
  }
  return parts.join(' · ');
}
