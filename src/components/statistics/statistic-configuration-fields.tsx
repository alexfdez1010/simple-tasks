'use client';

import { getStatisticsCopy } from '@/components/statistics/copy';
import { StatisticDateFields } from '@/components/statistics/statistic-date-fields';
import {
  GROUPS,
  MEASURES,
  NUMERIC_MEASURES,
  SCOPES,
  VISUALIZATIONS,
  localizeStatisticOptions,
} from '@/components/statistics/statistic-options';
import { StatisticSelect } from '@/components/statistics/statistic-select';
import {
  StatisticDateBucket,
  StatisticDateField,
  StatisticGroupBy,
  StatisticMeasure,
  StatisticScope,
  StatisticVisualization,
} from '@/generated/prisma';
import { useI18n } from '@/lib/i18n/provider';
import type { PropertyDefinition } from '@/lib/properties/types';
import type { CreateStatisticInput } from '@/lib/statistics/types';

interface StatisticConfigurationFieldsProps {
  properties: PropertyDefinition[];
  values: CreateStatisticInput;
  onChange: (values: CreateStatisticInput) => void;
}

/** Returns chart dimensions compatible with the selected visualization. */
function getGroupOptions(visualization: StatisticVisualization) {
  if (visualization === StatisticVisualization.LINE) {
    return GROUPS.filter((option) => option.id === StatisticGroupBy.DATE);
  }
  if (visualization === StatisticVisualization.DONUT) {
    return GROUPS.filter((option) => option.id !== StatisticGroupBy.DATE);
  }
  return GROUPS;
}

/** Repairs dependent dimension fields after a visualization change. */
function withVisualization(
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
  return {
    ...values,
    dateBucket:
      groupBy === StatisticGroupBy.DATE
        ? (values.dateBucket ?? StatisticDateBucket.MONTH)
        : null,
    dateField:
      groupBy === StatisticGroupBy.DATE
        ? (values.dateField ?? StatisticDateField.COMPLETED_AT)
        : null,
    groupBy,
    visualization,
  };
}

/** Repairs dependent fields after changing a chart dimension. */
function withGroup(
  values: CreateStatisticInput,
  groupBy: StatisticGroupBy,
  properties: PropertyDefinition[],
): CreateStatisticInput {
  return {
    ...values,
    dateBucket:
      groupBy === StatisticGroupBy.DATE
        ? (values.dateBucket ?? StatisticDateBucket.MONTH)
        : null,
    dateField:
      groupBy === StatisticGroupBy.DATE
        ? (values.dateField ?? StatisticDateField.COMPLETED_AT)
        : null,
    groupBy,
    groupPropertyId:
      groupBy === StatisticGroupBy.PROPERTY
        ? (values.groupPropertyId ?? properties[0]?.id ?? null)
        : null,
  };
}

/** Renders measure, scope, grouping, and dependent property/date selectors. */
export function StatisticConfigurationFields({
  properties,
  values,
  onChange,
}: StatisticConfigurationFieldsProps): React.JSX.Element {
  const { language } = useI18n();
  const numberProperties = properties.filter(({ type }) => type === 'NUMBER');
  const groupProperties = properties.filter(({ type }) => type !== 'DATE');
  const dateProperties = properties.filter(({ type }) => type === 'DATE');
  return (
    <div className="statistics-form-grid">
      <StatisticSelect
        label={getStatisticsCopy(language, 'visualization')}
        options={localizeStatisticOptions(language, VISUALIZATIONS)}
        value={values.visualization}
        onChange={(value) =>
          onChange(withVisualization(values, value as StatisticVisualization))
        }
      />
      <StatisticSelect
        label={getStatisticsCopy(language, 'measure')}
        options={localizeStatisticOptions(language, MEASURES)}
        value={values.measure}
        onChange={(value) => {
          const measure = value as StatisticMeasure;
          onChange({
            ...values,
            measure,
            measurePropertyId: NUMERIC_MEASURES.has(measure)
              ? (values.measurePropertyId ?? numberProperties[0]?.id ?? null)
              : null,
          });
        }}
      />
      <StatisticSelect
        label={getStatisticsCopy(language, 'scope')}
        options={localizeStatisticOptions(language, SCOPES)}
        value={values.scope}
        onChange={(scope) =>
          onChange({ ...values, scope: scope as StatisticScope })
        }
      />
      {values.visualization !== StatisticVisualization.KPI ? (
        <StatisticSelect
          label={getStatisticsCopy(language, 'groupBy')}
          options={localizeStatisticOptions(
            language,
            getGroupOptions(values.visualization),
          )}
          value={values.groupBy}
          onChange={(group) =>
            onChange(
              withGroup(values, group as StatisticGroupBy, groupProperties),
            )
          }
        />
      ) : null}
      {NUMERIC_MEASURES.has(values.measure) ? (
        <StatisticSelect
          label={getStatisticsCopy(language, 'numericProperty')}
          options={numberProperties.map(({ id, name }) => ({
            id,
            label: name,
          }))}
          value={values.measurePropertyId}
          onChange={(measurePropertyId) =>
            onChange({ ...values, measurePropertyId })
          }
        />
      ) : null}
      {values.groupBy === StatisticGroupBy.PROPERTY ? (
        <StatisticSelect
          label={getStatisticsCopy(language, 'property')}
          options={groupProperties.map(({ id, name }) => ({ id, label: name }))}
          value={values.groupPropertyId}
          onChange={(groupPropertyId) =>
            onChange({ ...values, groupPropertyId })
          }
        />
      ) : null}
      <StatisticDateFields
        dateProperties={dateProperties}
        values={values}
        onChange={onChange}
      />
    </div>
  );
}
