'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getStatisticsCopy } from '@/components/statistics/copy';
import { StatisticsTooltip } from '@/components/statistics/property-statistic-card';
import { StatisticChartLegend } from '@/components/statistics/statistic-chart-legend';
import {
  formatSeriesLabel,
  formatStatisticValue,
} from '@/components/statistics/statistic-format';
import { useI18n } from '@/lib/i18n/provider';
import type {
  StatisticChartResult,
  StatisticDefinition,
} from '@/lib/statistics/types';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

interface StatisticChartProps {
  definition: StatisticDefinition;
  result: StatisticChartResult;
}

/** Renders the configured Recharts visualization and its exact text equivalent. */
export function StatisticChart({
  definition,
  result,
}: StatisticChartProps): React.JSX.Element {
  const { language, locale } = useI18n();
  const data = result.values.map((entry, index) => ({
    ...entry,
    color: entry.color ?? CHART_COLORS[index % CHART_COLORS.length],
    displayLabel: formatSeriesLabel(entry.label, definition, locale, language),
    plottedValue: entry.value ?? 0,
  }));
  const formatValue = (value: number): string =>
    formatStatisticValue(value, result.format, locale, language);
  const tooltip = (
    <StatisticsTooltip locale={locale} formatValue={formatValue} />
  );
  const height =
    definition.visualization === 'BAR' ? Math.max(210, data.length * 46) : 260;
  const hasData = data.some((entry) => entry.taskCount > 0);

  if (!hasData) {
    return (
      <p className="statistics-chart-empty">
        {getStatisticsCopy(language, 'noChartData')}
      </p>
    );
  }

  return (
    <>
      <div className="statistics-chart" style={{ height }}>
        {definition.visualization === 'LINE' ? (
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ bottom: 8, left: 0, right: 12, top: 12 }}
            responsive
            style={{ height: '100%', width: '100%' }}
            title={definition.name}
          >
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" />
            <XAxis
              axisLine={false}
              dataKey="displayLabel"
              minTickGap={24}
              tickLine={false}
            />
            <YAxis
              allowDecimals={result.format !== 'NUMBER'}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <Tooltip content={tooltip} cursor={{ stroke: 'var(--chart-1)' }} />
            <Line
              activeDot={{ r: 5 }}
              dataKey="plottedValue"
              dot={{ r: 3 }}
              isAnimationActive={false}
              stroke="var(--chart-1)"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        ) : definition.visualization === 'DONUT' ? (
          <PieChart
            accessibilityLayer
            responsive
            style={{ height: '100%', width: '100%' }}
            title={definition.name}
          >
            <Tooltip content={tooltip} />
            <Pie
              data={data}
              dataKey="plottedValue"
              innerRadius="58%"
              isAnimationActive={false}
              nameKey="displayLabel"
              outerRadius="88%"
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell fill={entry.color} key={entry.displayLabel} />
              ))}
            </Pie>
          </PieChart>
        ) : (
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ bottom: 4, left: 0, right: 16, top: 4 }}
            responsive
            style={{ height: '100%', width: '100%' }}
            title={definition.name}
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--chart-grid)"
              strokeDasharray="3 5"
            />
            <XAxis
              allowDecimals={result.format !== 'NUMBER'}
              axisLine={false}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="displayLabel"
              tickLine={false}
              type="category"
              width={104}
            />
            <Tooltip
              content={tooltip}
              cursor={{ fill: 'var(--chart-hover)' }}
            />
            <Bar
              dataKey="plottedValue"
              isAnimationActive={false}
              maxBarSize={22}
              radius={[0, 7, 7, 0]}
            >
              {data.map((entry) => (
                <Cell fill={entry.color} key={entry.displayLabel} />
              ))}
            </Bar>
          </BarChart>
        )}
      </div>
      <StatisticChartLegend
        data={data}
        definition={definition}
        result={result}
      />
    </>
  );
}
