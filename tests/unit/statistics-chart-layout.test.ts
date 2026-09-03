import { getStatisticChartHeight } from '@/components/statistics/statistic-chart-layout';
import { StatisticSize, StatisticVisualization } from '@/generated/prisma';
import { describe, expect, it } from 'vitest';

describe('getStatisticChartHeight', () => {
  /** Proves each persisted card format receives its intended base plot height. */
  it.each([
    [StatisticSize.COMPACT, 220],
    [StatisticSize.SQUARE, 260],
    [StatisticSize.WIDE, 290],
    [StatisticSize.FULL, 340],
    [StatisticSize.AUTO, 260],
  ])('maps %s cards to %i pixels', (size, expected) => {
    expect(
      getStatisticChartHeight(
        { size, visualization: StatisticVisualization.LINE },
        2,
      ),
    ).toBe(expected);
  });

  /** Proves categorical bars expand instead of clipping their text equivalent. */
  it('grows a bar chart for long category lists', () => {
    expect(
      getStatisticChartHeight(
        {
          size: StatisticSize.COMPACT,
          visualization: StatisticVisualization.BAR,
        },
        8,
      ),
    ).toBe(368);
  });
});
