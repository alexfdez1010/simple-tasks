import {
  StatisticDateBucket,
  StatisticDateField,
  TaskPropertyType,
} from '@/generated/prisma';
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

/** Resolves one system or custom date dimension for a task. */
function getTaskDate(
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

/** Converts a date to a sortable ISO-like bucket key. */
function getDateBucket(date: Date, bucket: StatisticDateBucket): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  if (bucket === StatisticDateBucket.YEAR) return String(year);
  if (bucket === StatisticDateBucket.QUARTER) {
    return `${year}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
  }
  if (bucket === StatisticDateBucket.MONTH) return `${year}-${month}`;
  const day = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
  if (bucket === StatisticDateBucket.WEEK) {
    day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  }
  return day.toISOString().slice(0, 10);
}

/** Groups tasks chronologically through a configured date dimension. */
export function groupByDate(
  tasks: StatisticTaskRecord[],
  definition: StatisticDefinition,
): StatisticTaskGroup[] {
  const groups = new Map<string, StatisticTaskRecord[]>();
  for (const task of tasks) {
    const date = getTaskDate(task, definition);
    if (!date || !definition.dateBucket) continue;
    addToGroup(groups, getDateBucket(date, definition.dateBucket), task);
  }
  return [...groups]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, groupedTasks]) => ({
      color: null,
      label,
      tasks: groupedTasks,
    }));
}
