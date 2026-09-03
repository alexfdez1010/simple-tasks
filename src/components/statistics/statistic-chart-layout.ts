import type { StatisticDefinition } from '@/lib/statistics/types';

/** Selects a comfortable plot height for the configured card footprint. */
export function getStatisticChartHeight(
  definition: Pick<StatisticDefinition, 'size' | 'visualization'>,
  valueCount: number,
): number {
  const baseHeight =
    definition.size === 'FULL'
      ? 340
      : definition.size === 'WIDE'
        ? 290
        : definition.size === 'COMPACT'
          ? 220
          : 260;
  return definition.visualization === 'BAR'
    ? Math.max(baseHeight, valueCount * 46)
    : baseHeight;
}
