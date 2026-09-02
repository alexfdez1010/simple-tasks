'use client';

import { Card } from '@heroui/react';
import { useNumberFormatter } from '@react-aria/i18n';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getStatisticsCopy } from '@/components/statistics/copy';
import type { PropertyStatistic } from '@/lib/statistics/types';
import { useI18n } from '@/lib/i18n/provider';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

interface PropertyStatisticCardProps {
  completedTaskCount: number;
  statistic: PropertyStatistic;
}

/** Renders one accessible Recharts distribution and its exact text equivalent. */
export function PropertyStatisticCard({
  completedTaskCount,
  statistic,
}: PropertyStatisticCardProps): React.JSX.Element {
  const { language } = useI18n();
  const numberFormatter = useNumberFormatter();
  const data = statistic.values.map((value, index) => ({
    ...value,
    color: CHART_COLORS[index % CHART_COLORS.length],
    displayLabel: value.label ?? getStatisticsCopy(language, 'unassigned'),
  }));
  const chartHeight = Math.max(180, data.length * 52);

  return (
    <Card className="statistics-property-card" variant="secondary">
      <Card.Header className="statistics-property-header">
        <div>
          <Card.Title>{statistic.name}</Card.Title>
          <Card.Description>
            {getStatisticsCopy(language, 'assigned', {
              count: numberFormatter.format(statistic.assignedTaskCount),
              total: numberFormatter.format(completedTaskCount),
            })}
          </Card.Description>
        </div>
        <span className="statistics-property-type">
          {statistic.type === 'MULTI_SELECT' ? 'MULTI' : 'SELECT'}
        </span>
      </Card.Header>
      <Card.Content className="statistics-property-content">
        <div className="statistics-chart" style={{ height: chartHeight }}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ bottom: 4, left: 0, right: 16, top: 4 }}
            responsive
            style={{ height: '100%', width: '100%' }}
            title={statistic.name}
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--chart-grid)"
              strokeDasharray="3 5"
            />
            <XAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="displayLabel"
              tickLine={false}
              type="category"
              width={92}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--divider)',
                borderRadius: '0.625rem',
              }}
              cursor={{ fill: 'var(--chart-hover)' }}
              formatter={(value) => [
                `${numberFormatter.format(Number(value))} ${getStatisticsCopy(language, 'tasks')}`,
                '',
              ]}
            />
            <Bar
              dataKey="count"
              isAnimationActive={false}
              maxBarSize={22}
              radius={[0, 7, 7, 0]}
            >
              {data.map((entry) => (
                <Cell fill={entry.color} key={entry.displayLabel} />
              ))}
            </Bar>
          </BarChart>
        </div>
        <ul className="statistics-legend" aria-label={statistic.name}>
          {data.map((entry) => (
            <li key={entry.displayLabel}>
              <span
                aria-hidden="true"
                className="statistics-legend-dot"
                style={{ background: entry.color }}
              />
              <span className="statistics-legend-label">
                {entry.displayLabel}
              </span>
              <strong>{numberFormatter.format(entry.count)}</strong>
              <span>
                {getStatisticsCopy(language, 'shareOfCompleted', {
                  percentage: numberFormatter.format(entry.percentage),
                })}
              </span>
            </li>
          ))}
        </ul>
        {statistic.type === 'MULTI_SELECT' ? (
          <p className="statistics-property-note">
            {getStatisticsCopy(language, 'multiSelectNote')}
          </p>
        ) : null}
      </Card.Content>
    </Card>
  );
}
