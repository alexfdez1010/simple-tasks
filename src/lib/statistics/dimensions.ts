import { TaskPropertyType } from '@/generated/prisma';
import {
  getStatisticDateBucket,
  getStatisticTaskDate,
} from '@/lib/statistics/dates';
import { MAX_STATISTIC_CATEGORIES } from '@/lib/statistics/limits';
import type {
  StatisticDefinition,
  StatisticPropertyRecord,
  StatisticStatusRecord,
  StatisticTaskRecord,
} from '@/lib/statistics/types';

export interface StatisticTaskGroup {
  color: string | null;
  label: string | null;
  tasks: StatisticTaskRecord[];
}

/** Reads one configured property value from a task. */
function getPropertyValue(task: StatisticTaskRecord, propertyId: string) {
  return task.propertyValues.find((value) => value.propertyId === propertyId)
    ?.value;
}

/** Adds a task to one keyed category without duplicating it. */
function addToGroup(
  groups: Map<string | null, StatisticTaskRecord[]>,
  key: string | null,
  task: StatisticTaskRecord,
): void {
  const tasks = groups.get(key) ?? [];
  if (!tasks.some((candidate) => candidate.id === task.id)) tasks.push(task);
  groups.set(key, tasks);
}

/** Folds low-volume categories into one remainder group for legible charts. */
function limitGroups(groups: StatisticTaskGroup[]): StatisticTaskGroup[] {
  if (groups.length <= MAX_STATISTIC_CATEGORIES) return groups;
  const ranked = [...groups].sort((a, b) => b.tasks.length - a.tasks.length);
  const visible = ranked.slice(0, MAX_STATISTIC_CATEGORIES - 1);
  const remainder = ranked.slice(MAX_STATISTIC_CATEGORIES - 1);
  const tasks = new Map(
    remainder.flatMap((group) => group.tasks.map((task) => [task.id, task])),
  );
  return [
    ...visible,
    { color: null, label: '__OTHER__', tasks: [...tasks.values()] },
  ];
}

/** Groups tasks by ordered workflow status. */
export function groupByStatus(
  tasks: StatisticTaskRecord[],
  statuses: StatisticStatusRecord[],
): StatisticTaskGroup[] {
  return statuses.map((status) => ({
    color: status.color,
    label: status.name,
    tasks: tasks.filter((task) => task.statusId === status.id),
  }));
}

/** Groups tasks by any non-date custom property. */
export function groupByProperty(
  tasks: StatisticTaskRecord[],
  property: StatisticPropertyRecord,
): StatisticTaskGroup[] {
  const groups = new Map<string | null, StatisticTaskRecord[]>();
  if (
    property.type === TaskPropertyType.SELECT ||
    property.type === TaskPropertyType.MULTI_SELECT
  ) {
    for (const option of property.options) groups.set(option, []);
  }
  for (const task of tasks) {
    const value = getPropertyValue(task, property.id);
    const values = Array.isArray(value) ? [...new Set(value)] : [value];
    const labels = values.flatMap((item) =>
      typeof item === 'string' && item.trim()
        ? [item.trim()]
        : typeof item === 'number'
          ? [String(item)]
          : [],
    );
    if (labels.length === 0) addToGroup(groups, null, task);
    for (const label of labels) addToGroup(groups, label, task);
  }
  return limitGroups(
    [...groups].map(([label, groupedTasks]) => ({
      color: null,
      label,
      tasks: groupedTasks,
    })),
  );
}

/** Groups tasks chronologically through a configured date dimension. */
export function groupByDate(
  tasks: StatisticTaskRecord[],
  definition: StatisticDefinition,
): StatisticTaskGroup[] {
  const groups = new Map<string, StatisticTaskRecord[]>();
  for (const task of tasks) {
    const date = getStatisticTaskDate(task, definition);
    if (!date || !definition.dateBucket) continue;
    addToGroup(
      groups,
      getStatisticDateBucket(date, definition.dateBucket),
      task,
    );
  }
  return [...groups]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, groupedTasks]) => ({
      color: null,
      label,
      tasks: groupedTasks,
    }));
}
