import { StatisticMeasure } from '@/generated/prisma';
import type {
  StatisticDefinition,
  StatisticTaskRecord,
  StatisticValueFormat,
} from '@/lib/statistics/types';

interface MeasureCalculation {
  format: StatisticValueFormat;
  sampleSize: number;
  value: number | null;
}

/** Reads every finite numeric value used by a configured arithmetic measure. */
function getNumericValues(
  tasks: StatisticTaskRecord[],
  propertyId: string | null,
): number[] {
  if (!propertyId) return [];
  return tasks.flatMap((task) => {
    const value = task.propertyValues.find(
      (candidate) => candidate.propertyId === propertyId,
    )?.value;
    return typeof value === 'number' && Number.isFinite(value) ? [value] : [];
  });
}

/** Returns a rounded percentage or no value when the denominator is empty. */
function percentage(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : (numerator / denominator) * 100;
}

/** Calculates one scalar measure for an arbitrary task subset. */
export function calculateMeasure(
  tasks: StatisticTaskRecord[],
  definition: StatisticDefinition,
  now: Date,
): MeasureCalculation {
  if (definition.measure === StatisticMeasure.COUNT) {
    return { format: 'NUMBER', sampleSize: tasks.length, value: tasks.length };
  }
  if (definition.measure === StatisticMeasure.OVERDUE_COUNT) {
    const value = tasks.filter(
      (task) => !task.completedAt && task.dueDate && task.dueDate < now,
    ).length;
    return { format: 'NUMBER', sampleSize: tasks.length, value };
  }
  if (definition.measure === StatisticMeasure.COMPLETION_RATE) {
    const completed = tasks.filter((task) => task.completedAt).length;
    return {
      format: 'PERCENTAGE',
      sampleSize: tasks.length,
      value: percentage(completed, tasks.length),
    };
  }
  if (definition.measure === StatisticMeasure.ON_TIME_RATE) {
    const eligible = tasks.filter((task) => task.completedAt && task.dueDate);
    const onTime = eligible.filter(
      (task) => task.completedAt! <= task.dueDate!,
    ).length;
    return {
      format: 'PERCENTAGE',
      sampleSize: eligible.length,
      value: percentage(onTime, eligible.length),
    };
  }
  if (definition.measure === StatisticMeasure.AVERAGE_RESOLUTION_TIME) {
    const durations = tasks.flatMap((task) =>
      task.completedAt
        ? [Math.max(0, task.completedAt.getTime() - task.createdAt.getTime())]
        : [],
    );
    const value = durations.length
      ? durations.reduce((sum, duration) => sum + duration, 0) /
        durations.length
      : null;
    return { format: 'DURATION', sampleSize: durations.length, value };
  }

  const values = getNumericValues(tasks, definition.measurePropertyId);
  let value: number | null = null;
  if (values.length && definition.measure === StatisticMeasure.SUM) {
    value = values.reduce((sum, item) => sum + item, 0);
  } else if (values.length && definition.measure === StatisticMeasure.AVERAGE) {
    value = values.reduce((sum, item) => sum + item, 0) / values.length;
  } else if (values.length && definition.measure === StatisticMeasure.MINIMUM) {
    value = Math.min(...values);
  } else if (values.length && definition.measure === StatisticMeasure.MAXIMUM) {
    value = Math.max(...values);
  }
  return { format: 'NUMBER', sampleSize: values.length, value };
}
