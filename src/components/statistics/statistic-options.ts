import {
  StatisticDateBucket,
  StatisticDateField,
  StatisticDateRange,
  StatisticGroupBy,
  StatisticMeasure,
  StatisticScope,
  StatisticVisualization,
} from '@/generated/prisma';
import type { StatisticsCopyKey } from '@/components/statistics/copy';
import { getStatisticsCopy } from '@/components/statistics/copy';
import type { Language } from '@/lib/i18n/config';
import type { CreateStatisticInput } from '@/lib/statistics/types';

export interface StatisticOption<T extends string = string> {
  id: T;
  labelKey: StatisticsCopyKey;
}

export const VISUALIZATIONS: StatisticOption<StatisticVisualization>[] = [
  { id: StatisticVisualization.KPI, labelKey: 'visualizationKpi' },
  { id: StatisticVisualization.BAR, labelKey: 'visualizationBar' },
  { id: StatisticVisualization.DONUT, labelKey: 'visualizationDonut' },
  { id: StatisticVisualization.LINE, labelKey: 'visualizationLine' },
];

export const MEASURES: StatisticOption<StatisticMeasure>[] = [
  { id: StatisticMeasure.COUNT, labelKey: 'measureCount' },
  { id: StatisticMeasure.COMPLETION_RATE, labelKey: 'measureCompletionRate' },
  {
    id: StatisticMeasure.AVERAGE_RESOLUTION_TIME,
    labelKey: 'measureResolution',
  },
  { id: StatisticMeasure.OVERDUE_COUNT, labelKey: 'measureOverdue' },
  { id: StatisticMeasure.ON_TIME_RATE, labelKey: 'measureOnTime' },
  { id: StatisticMeasure.SUM, labelKey: 'measureSum' },
  { id: StatisticMeasure.AVERAGE, labelKey: 'measureAverage' },
  { id: StatisticMeasure.MINIMUM, labelKey: 'measureMinimum' },
  { id: StatisticMeasure.MAXIMUM, labelKey: 'measureMaximum' },
];

export const NUMERIC_MEASURES = new Set<StatisticMeasure>([
  StatisticMeasure.SUM,
  StatisticMeasure.AVERAGE,
  StatisticMeasure.MINIMUM,
  StatisticMeasure.MAXIMUM,
]);

export const SCOPES: StatisticOption<StatisticScope>[] = [
  { id: StatisticScope.ALL, labelKey: 'scopeAll' },
  { id: StatisticScope.ACTIVE, labelKey: 'scopeActive' },
  { id: StatisticScope.COMPLETED, labelKey: 'scopeCompleted' },
];

export const GROUPS: StatisticOption<StatisticGroupBy>[] = [
  { id: StatisticGroupBy.STATUS, labelKey: 'groupStatus' },
  { id: StatisticGroupBy.PROPERTY, labelKey: 'groupProperty' },
  { id: StatisticGroupBy.DATE, labelKey: 'groupDate' },
];

export const DATE_FIELDS: StatisticOption<StatisticDateField>[] = [
  { id: StatisticDateField.CREATED_AT, labelKey: 'dateCreated' },
  { id: StatisticDateField.UPDATED_AT, labelKey: 'dateUpdated' },
  { id: StatisticDateField.DUE_DATE, labelKey: 'dateDeadline' },
  { id: StatisticDateField.COMPLETED_AT, labelKey: 'dateCompleted' },
  { id: StatisticDateField.PROPERTY, labelKey: 'dateProperty' },
];

export const DATE_BUCKETS: StatisticOption<StatisticDateBucket>[] = [
  { id: StatisticDateBucket.DAY, labelKey: 'bucketDay' },
  { id: StatisticDateBucket.WEEK, labelKey: 'bucketWeek' },
  { id: StatisticDateBucket.MONTH, labelKey: 'bucketMonth' },
  { id: StatisticDateBucket.QUARTER, labelKey: 'bucketQuarter' },
  { id: StatisticDateBucket.YEAR, labelKey: 'bucketYear' },
];

/** Converts typed option metadata into localized selector rows. */
export function localizeStatisticOptions(
  language: Language,
  options: StatisticOption[],
): Array<{ id: string; label: string }> {
  return options.map((option) => ({
    id: option.id,
    label: getStatisticsCopy(language, option.labelKey),
  }));
}

/** Creates a complete, valid draft for a new KPI statistic. */
export function createDefaultStatistic(name: string): CreateStatisticInput {
  return {
    dateBucket: null,
    dateField: null,
    datePropertyId: null,
    dateRange: StatisticDateRange.ALL_TIME,
    groupBy: StatisticGroupBy.NONE,
    groupPropertyId: null,
    measure: StatisticMeasure.COUNT,
    measurePropertyId: null,
    name,
    scope: StatisticScope.ALL,
    statusIds: [],
    visualization: StatisticVisualization.KPI,
  };
}
