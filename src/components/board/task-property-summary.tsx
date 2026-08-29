import type {
  PropertyDefinition,
  TaskPropertyValueData,
} from '@/components/board/types';

interface TaskPropertySummaryProps {
  properties: PropertyDefinition[];
  values: TaskPropertyValueData[];
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
});

/** Formats one stored property value according to its configured type. */
function formatValue(
  property: PropertyDefinition,
  value: TaskPropertyValueData['value'],
): string {
  if (Array.isArray(value)) return value.join(', ');
  if (property.type === 'NUMBER' && typeof value === 'number') {
    return NUMBER_FORMATTER.format(value);
  }
  if (property.type === 'DATE' && typeof value === 'string') {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    return Number.isNaN(date.valueOf()) ? value : DATE_FORMATTER.format(date);
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
    return [{ property, displayValue: formatValue(property, value) }];
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
