'use client';

import {
  useDateFormatter,
  useListFormatter,
  useNumberFormatter,
} from '@react-aria/i18n';

import type {
  PropertyDefinition,
  TaskPropertyValueData,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface TaskPropertySummaryProps {
  properties: PropertyDefinition[];
  values: TaskPropertyValueData[];
}

/** Formats one stored property value according to its configured type. */
function formatValue(
  property: PropertyDefinition,
  value: TaskPropertyValueData['value'],
  locale: string,
  dateFormatter: Intl.DateTimeFormat,
  numberFormatter: Intl.NumberFormat,
  listFormatter: Intl.ListFormat,
): string {
  if (Array.isArray(value)) {
    return locale.startsWith('en-')
      ? value.join(', ')
      : listFormatter.format(value);
  }
  if (property.type === 'NUMBER' && typeof value === 'number') {
    return numberFormatter.format(value);
  }
  if (property.type === 'DATE' && typeof value === 'string') {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    return Number.isNaN(date.valueOf()) ? value : dateFormatter.format(date);
  }
  return String(value);
}

/**
 * Displays only populated custom values in configured property order.
 *
 * @param props - Ordered definitions and the task's stored values.
 * @returns A compact definition list, or null when every value is empty.
 */
export function TaskPropertySummary({
  properties,
  values,
}: TaskPropertySummaryProps) {
  const { locale } = useI18n();
  const dateFormatter = useDateFormatter({
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const numberFormatter = useNumberFormatter({ maximumFractionDigits: 6 });
  const listFormatter = useListFormatter({
    style: 'short',
    type: 'conjunction',
  });
  const valueByProperty = new Map(
    values.map((entry) => [entry.propertyId, entry.value]),
  );
  const populated = properties.flatMap((property) => {
    const value = valueByProperty.get(property.id);
    if (
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return [];
    }
    return [
      {
        property,
        displayValue: formatValue(
          property,
          value,
          locale,
          dateFormatter,
          numberFormatter,
          listFormatter,
        ),
      },
    ];
  });

  if (populated.length === 0) return null;

  return (
    <dl className="flex max-h-9 flex-wrap gap-x-3 gap-y-0.5 overflow-hidden text-[11px] leading-4">
      {populated.map(({ property, displayValue }) => (
        <div className="flex min-w-0 max-w-full gap-1" key={property.id}>
          <dt className="shrink-0 text-muted">{property.name}</dt>
          <dd
            className="truncate font-medium text-foreground"
            title={displayValue}
          >
            {displayValue}
          </dd>
        </div>
      ))}
    </dl>
  );
}
