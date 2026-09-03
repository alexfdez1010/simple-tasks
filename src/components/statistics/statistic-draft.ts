import {
  StatisticDateBucket,
  StatisticDateField,
  StatisticDateRange,
  StatisticGroupBy,
  StatisticVisualization,
} from '@/generated/prisma';
import type { PropertyDefinition } from '@/lib/properties/types';
import type { CreateStatisticInput } from '@/lib/statistics/types';

/** Returns whether a draft needs a configured date source. */
function usesDate(values: CreateStatisticInput): boolean {
  return (
    values.groupBy === StatisticGroupBy.DATE ||
    values.dateRange !== StatisticDateRange.ALL_TIME
  );
}

/** Repairs dependent date fields after a draft configuration change. */
function withValidDateFields(
  values: CreateStatisticInput,
): CreateStatisticInput {
  const needsDate = usesDate(values);
  const dateField = needsDate
    ? (values.dateField ?? StatisticDateField.COMPLETED_AT)
    : null;
  return {
    ...values,
    dateBucket:
      values.groupBy === StatisticGroupBy.DATE
        ? (values.dateBucket ?? StatisticDateBucket.MONTH)
        : null,
    dateField,
    datePropertyId:
      dateField === StatisticDateField.PROPERTY ? values.datePropertyId : null,
  };
}

/** Repairs dimension fields after changing a visualization. */
export function withStatisticVisualization(
  values: CreateStatisticInput,
  visualization: StatisticVisualization,
): CreateStatisticInput {
  const groupBy =
    visualization === StatisticVisualization.KPI
      ? StatisticGroupBy.NONE
      : visualization === StatisticVisualization.LINE
        ? StatisticGroupBy.DATE
        : values.groupBy === StatisticGroupBy.NONE ||
            (visualization === StatisticVisualization.DONUT &&
              values.groupBy === StatisticGroupBy.DATE)
          ? StatisticGroupBy.STATUS
          : values.groupBy;
  return withValidDateFields({ ...values, groupBy, visualization });
}

/** Repairs dependent fields after changing a chart dimension. */
export function withStatisticGroup(
  values: CreateStatisticInput,
  groupBy: StatisticGroupBy,
  properties: PropertyDefinition[],
): CreateStatisticInput {
  return withValidDateFields({
    ...values,
    groupBy,
    groupPropertyId:
      groupBy === StatisticGroupBy.PROPERTY
        ? (values.groupPropertyId ?? properties[0]?.id ?? null)
        : null,
  });
}
