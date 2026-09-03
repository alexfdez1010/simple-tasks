'use client';

import { getStatisticsCopy } from '@/components/statistics/copy';
import {
  DATE_BUCKETS,
  DATE_FIELDS,
  localizeStatisticOptions,
} from '@/components/statistics/statistic-options';
import { StatisticSelect } from '@/components/statistics/statistic-select';
import { StatisticDateBucket, StatisticDateField } from '@/generated/prisma';
import { useI18n } from '@/lib/i18n/provider';
import type { PropertyDefinition } from '@/lib/properties/types';
import type { CreateStatisticInput } from '@/lib/statistics/types';

interface StatisticDateFieldsProps {
  dateProperties: PropertyDefinition[];
  values: CreateStatisticInput;
  onChange: (values: CreateStatisticInput) => void;
}

/** Renders date-source and bucket fields when a statistic uses a timeline. */
export function StatisticDateFields({
  dateProperties,
  values,
  onChange,
}: StatisticDateFieldsProps): React.JSX.Element | null {
  const { language } = useI18n();
  if (values.groupBy !== 'DATE') return null;
  return (
    <>
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
