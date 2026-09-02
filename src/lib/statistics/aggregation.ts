import type {
  CompletedTaskRecord,
  PropertyStatistic,
  SelectablePropertyRecord,
  StatisticsSnapshot,
  StatisticsSource,
} from '@/lib/statistics/types';

/** Converts a count into a rounded share of all completed tasks. */
function getPercentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

/** Returns the unique selected values stored for one property on one task. */
function getSelections(
  task: CompletedTaskRecord,
  property: SelectablePropertyRecord,
): string[] {
  const stored = task.propertyValues.find(
    (value) => value.propertyId === property.id,
  )?.value;
  if (property.type === 'SELECT') {
    return typeof stored === 'string' ? [stored] : [];
  }
  return Array.isArray(stored) ? [...new Set(stored)] : [];
}

/** Builds one property distribution without depending on persistence details. */
function buildPropertyStatistic(
  property: SelectablePropertyRecord,
  tasks: CompletedTaskRecord[],
): PropertyStatistic {
  const counts = new Map(property.options.map((option) => [option, 0]));
  let assignedTaskCount = 0;
  for (const task of tasks) {
    const selections = getSelections(task, property);
    if (selections.length > 0) assignedTaskCount += 1;
    for (const selection of selections) {
      counts.set(selection, (counts.get(selection) ?? 0) + 1);
    }
  }
  const values: PropertyStatistic['values'] = [...counts].map(
    ([label, count]) => ({
      count,
      label,
      percentage: getPercentage(count, tasks.length),
    }),
  );
  const unassignedCount = tasks.length - assignedTaskCount;
  if (unassignedCount > 0) {
    values.push({
      count: unassignedCount,
      label: null,
      percentage: getPercentage(unassignedCount, tasks.length),
    });
  }
  return {
    assignedTaskCount,
    name: property.name,
    propertyId: property.id,
    type: property.type,
    values,
  };
}

/** Calculates the mean elapsed time from task creation to completion. */
function getAverageResolutionTime(tasks: CompletedTaskRecord[]): number | null {
  if (tasks.length === 0) return null;
  const total = tasks.reduce(
    (sum, task) =>
      sum + Math.max(0, task.completedAt.getTime() - task.createdAt.getTime()),
    0,
  );
  return Math.round(total / tasks.length);
}

/** Produces the complete serializable statistics projection. */
export function buildStatisticsSnapshot(
  source: StatisticsSource,
): StatisticsSnapshot {
  return {
    averageResolutionTimeMs: getAverageResolutionTime(source.completedTasks),
    completedTaskCount: source.completedTasks.length,
    properties: source.properties.map((property) =>
      buildPropertyStatistic(property, source.completedTasks),
    ),
  };
}
