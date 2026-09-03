'use client';

import { getStatisticsCopy } from '@/components/statistics/copy';
import {
  getDateRangeFieldLabel,
  getDateRangeOptions,
} from '@/components/statistics/date-range-copy';
import {
  DATE_BUCKETS,
  DATE_FIELDS,
  localizeStatisticOptions,
} from '@/components/statistics/statistic-options';
import { StatisticSelect } from '@/components/statistics/statistic-select';
import {
  StatisticDateBucket,
  StatisticDateField,
  StatisticDateRange,
  StatisticGroupBy,
  StatisticScope,
} from '@/generated/prisma';
import { useI18n } from '@/lib/i18n/provider';
import type { PropertyDefinition } from '@/lib/properties/types';
import type { CreateStatisticInput } from '@/lib/statistics/types';

interface StatisticDateFieldsProps {
  dateProperties: PropertyDefinition[];
  values: CreateStatisticInput;
  onChange: (values: CreateStatisticInput) => void;
}

/** Renders relative period, date-source, and optional timeline bucket fields. */
export function StatisticDateFields({
  dateProperties,
  values,
  onChange,
}: StatisticDateFieldsProps): React.JSX.Element {
  const { language } = useI18n();
  const usesDate =
    values.groupBy === StatisticGroupBy.DATE ||
    values.dateRange !== StatisticDateRange.ALL_TIME;
  return (
    <>
      <StatisticSelect
        label={getDateRangeFieldLabel(language)}
        options={getDateRangeOptions(language)}
        value={values.dateRange}
        onChange={(range) => {
          const dateRange = range as StatisticDateRange;
          const needsDate =
            values.groupBy === StatisticGroupBy.DATE ||
            dateRange !== StatisticDateRange.ALL_TIME;
          onChange({
            ...values,
            dateField: needsDate
              ? (values.dateField ??
                (values.scope === StatisticScope.COMPLETED
                  ? StatisticDateField.COMPLETED_AT
                  : StatisticDateField.CREATED_AT))
              : null,
            datePropertyId: needsDate ? values.datePropertyId : null,
            dateRange,
          });
        }}
      />
      {usesDate ? (
        <StatisticSelect
          label={getStatisticsCopy(language, 'dateField')}
          options={localizeStatisticOptions(language, DATE_FIELDS)}
          value={values.dateField}
          onChange={(dateField) =>
            onChange({
              ...values,
              dateField: dateField as StatisticDateField,
              datePropertyId:
                dateField === 'PROPERTY'
                  ? (values.datePropertyId ?? dateProperties[0]?.id ?? null)
                  : null,
            })
          }
        />
      ) : null}
      {values.groupBy === StatisticGroupBy.DATE ? (
        <StatisticSelect
          label={getStatisticsCopy(language, 'bucket')}
          options={localizeStatisticOptions(language, DATE_BUCKETS)}
          value={values.dateBucket}
          onChange={(dateBucket) =>
            onChange({
              ...values,
              dateBucket: dateBucket as StatisticDateBucket,
            })
          }
        />
      ) : null}
      {values.dateField === 'PROPERTY' ? (
        <StatisticSelect
          label={getStatisticsCopy(language, 'dateProperty')}
          options={dateProperties.map(({ id, name }) => ({ id, label: name }))}
          value={values.datePropertyId}
          onChange={(datePropertyId) => onChange({ ...values, datePropertyId })}
        />
      ) : null}
    </>
  );
}
