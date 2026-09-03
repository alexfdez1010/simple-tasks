import {
  StatisticDateBucket,
  StatisticDateField,
  StatisticDateRange,
} from '@/generated/prisma';
import type {
  StatisticDefinition,
  StatisticTaskRecord,
} from '@/lib/statistics/types';

const DAY_IN_MILLISECONDS = 86_400_000;
const TRAILING_DAYS: Partial<Record<StatisticDateRange, number>> = {
  [StatisticDateRange.LAST_7_DAYS]: 7,
  [StatisticDateRange.LAST_30_DAYS]: 30,
  [StatisticDateRange.LAST_90_DAYS]: 90,
};
const UPCOMING_DAYS: Partial<Record<StatisticDateRange, number>> = {
  [StatisticDateRange.NEXT_7_DAYS]: 7,
  [StatisticDateRange.NEXT_30_DAYS]: 30,
};

/** Reads one configured property value from a task. */
function getPropertyValue(task: StatisticTaskRecord, propertyId: string) {
  return task.propertyValues.find((value) => value.propertyId === propertyId)
    ?.value;
}

/** Resolves one system or custom date configured by a statistic. */
export function getStatisticTaskDate(
  task: StatisticTaskRecord,
  definition: StatisticDefinition,
): Date | null {
  if (definition.dateField === StatisticDateField.CREATED_AT)
    return task.createdAt;
  if (definition.dateField === StatisticDateField.UPDATED_AT)
    return task.updatedAt;
  if (definition.dateField === StatisticDateField.DUE_DATE) return task.dueDate;
  if (definition.dateField === StatisticDateField.COMPLETED_AT)
    return task.completedAt;
  if (
    definition.dateField !== StatisticDateField.PROPERTY ||
    !definition.datePropertyId
  ) {
    return null;
  }
  const value = getPropertyValue(task, definition.datePropertyId);
  if (typeof value !== 'string') return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Returns the start of the UTC calendar day containing a date. */
function startOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Resolves an inclusive start and exclusive end for a relative period. */
export function getStatisticDateRange(
  range: StatisticDateRange,
  now: Date,
): { end: Date; start: Date } | null {
  if (range === StatisticDateRange.ALL_TIME) return null;
  const today = startOfDay(now);
  if (range === StatisticDateRange.TODAY) {
    return {
      start: today,
      end: new Date(today.getTime() + DAY_IN_MILLISECONDS),
    };
  }
  const trailingDays = TRAILING_DAYS[range];
  if (trailingDays) {
    return {
      start: new Date(
        today.getTime() - (trailingDays - 1) * DAY_IN_MILLISECONDS,
      ),
      end: new Date(today.getTime() + DAY_IN_MILLISECONDS),
    };
  }
  const upcomingDays = UPCOMING_DAYS[range];
  if (upcomingDays) {
    return {
      start: today,
      end: new Date(today.getTime() + upcomingDays * DAY_IN_MILLISECONDS),
    };
  }
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  if (range === StatisticDateRange.THIS_WEEK) {
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    return {
      start,
      end: new Date(start.getTime() + 7 * DAY_IN_MILLISECONDS),
    };
  }
  if (range === StatisticDateRange.THIS_MONTH) {
    return {
      start: new Date(Date.UTC(year, month, 1)),
      end: new Date(Date.UTC(year, month + 1, 1)),
    };
  }
  if (range === StatisticDateRange.THIS_QUARTER) {
    const quarterMonth = Math.floor(month / 3) * 3;
    return {
      start: new Date(Date.UTC(year, quarterMonth, 1)),
      end: new Date(Date.UTC(year, quarterMonth + 3, 1)),
    };
  }
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

/** Checks whether a task belongs to the configured relative date period. */
export function isTaskInStatisticDateRange(
  task: StatisticTaskRecord,
  definition: StatisticDefinition,
  now: Date,
): boolean {
  const range = getStatisticDateRange(definition.dateRange, now);
  if (!range) return true;
  const date = getStatisticTaskDate(task, definition);
  return Boolean(date && date >= range.start && date < range.end);
}

/** Converts a date to a sortable ISO-like bucket key. */
export function getStatisticDateBucket(
  date: Date,
  bucket: StatisticDateBucket,
): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  if (bucket === StatisticDateBucket.YEAR) return String(year);
  if (bucket === StatisticDateBucket.QUARTER) {
    return `${year}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
  }
  if (bucket === StatisticDateBucket.MONTH) return `${year}-${month}`;
  const day = startOfDay(date);
  if (bucket === StatisticDateBucket.WEEK) {
    day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  }
  return day.toISOString().slice(0, 10);
}
