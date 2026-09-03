import type { Prisma, StatisticWidget } from '@/generated/prisma';
import type { StatisticDefinition } from '@/lib/statistics/types';
import { conflict } from '@/lib/validation/errors';

/** Parses a JSON status filter into a stable string-array contract. */
export function deserializeStatusIds(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw conflict('The stored statistic status filter is invalid.');
  }
  return value as string[];
}

/** Converts a Prisma statistic record into its transport-safe representation. */
export function serializeStatistic(
  statistic: StatisticWidget,
): StatisticDefinition {
  return {
    ...statistic,
    statusIds: deserializeStatusIds(statistic.statusIds),
  };
}
