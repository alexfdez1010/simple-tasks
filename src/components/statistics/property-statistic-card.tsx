'use client';

interface StatisticsTooltipProps {
  active?: boolean;
  formatValue?: (value: number) => string;
  label?: string | number;
  locale: string;
  payload?: ReadonlyArray<{ value?: unknown }>;
  tasksLabel?: string;
}

/** Renders the active category and formatted value together on one tooltip row. */
export function StatisticsTooltip({
  active,
  formatValue,
  label,
  locale,
  payload,
  tasksLabel,
}: StatisticsTooltipProps): React.JSX.Element | null {
  const value = payload?.[0]?.value;
  if (!active || label === undefined || value === undefined) return null;
  const numericValue = Number(value);
  const formatted = formatValue
    ? formatValue(numericValue)
    : `${new Intl.NumberFormat(locale).format(numericValue)} ${tasksLabel ?? ''}`.trim();
  return (
    <div className="statistics-tooltip">
      <span>{label}:</span>
      <strong>{formatted}</strong>
    </div>
  );
}
