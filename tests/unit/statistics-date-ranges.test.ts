import { StatisticDateRange } from '@/generated/prisma';
import { getStatisticDateRange } from '@/lib/statistics/dates';
import { describe, expect, it } from 'vitest';

const NOW = new Date('2026-09-03T12:34:56.000Z');

describe('getStatisticDateRange', () => {
  /** Proves every trailing and upcoming option uses UTC calendar-day bounds. */
  it.each([
    [StatisticDateRange.TODAY, '2026-09-03', '2026-09-04'],
    [StatisticDateRange.LAST_7_DAYS, '2026-08-28', '2026-09-04'],
    [StatisticDateRange.LAST_30_DAYS, '2026-08-05', '2026-09-04'],
    [StatisticDateRange.LAST_90_DAYS, '2026-06-06', '2026-09-04'],
    [StatisticDateRange.NEXT_7_DAYS, '2026-09-03', '2026-09-10'],
    [StatisticDateRange.NEXT_30_DAYS, '2026-09-03', '2026-10-03'],
  ])('resolves %s', (range, start, end) => {
    expect(getStatisticDateRange(range, NOW)).toEqual({
      start: new Date(`${start}T00:00:00.000Z`),
      end: new Date(`${end}T00:00:00.000Z`),
    });
  });

  /** Proves current calendar periods align to Monday, month, quarter, and year. */
  it.each([
    [StatisticDateRange.THIS_WEEK, '2026-08-31', '2026-09-07'],
    [StatisticDateRange.THIS_MONTH, '2026-09-01', '2026-10-01'],
    [StatisticDateRange.THIS_QUARTER, '2026-07-01', '2026-10-01'],
    [StatisticDateRange.THIS_YEAR, '2026-01-01', '2027-01-01'],
  ])('resolves %s', (range, start, end) => {
    expect(getStatisticDateRange(range, NOW)).toEqual({
      start: new Date(`${start}T00:00:00.000Z`),
      end: new Date(`${end}T00:00:00.000Z`),
    });
  });

  /** Proves unbounded statistics do not allocate synthetic limits. */
  it('keeps all-time statistics unbounded', () => {
    expect(getStatisticDateRange(StatisticDateRange.ALL_TIME, NOW)).toBeNull();
  });
});
