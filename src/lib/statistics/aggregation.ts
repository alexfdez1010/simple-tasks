import { StatisticGroupBy, StatisticScope } from '@/generated/prisma';
import {
  groupByDate,
  groupByProperty,
  groupByStatus,
  type StatisticTaskGroup,
} from '@/lib/statistics/dimensions';
import { isTaskInStatisticDateRange } from '@/lib/statistics/dates';
import { calculateMeasure } from '@/lib/statistics/measures';
import type {
  StatisticDefinition,
  StatisticTaskRecord,
  StatisticWidgetResult,
  StatisticsSnapshot,
  StatisticsSource,
} from '@/lib/statistics/types';

/** Filters source tasks through a widget's scope and optional status selection. */
function filterTasks(
  tasks: StatisticTaskRecord[],
  definition: StatisticDefinition,
  now: Date,
): StatisticTaskRecord[] {
  const statusFilter = new Set(definition.statusIds);
  return tasks.filter((task) => {
    if (statusFilter.size && !statusFilter.has(task.statusId)) return false;
    if (definition.scope === StatisticScope.ACTIVE && task.completedAt)
      return false;
    if (definition.scope === StatisticScope.COMPLETED && !task.completedAt)
      return false;
    return isTaskInStatisticDateRange(task, definition, now);
  });
}

/** Resolves the configured chart dimension into task groups. */
function getGroups(
  tasks: StatisticTaskRecord[],
  definition: StatisticDefinition,
  source: StatisticsSource,
): { groups: StatisticTaskGroup[]; multiValue: boolean } {
  if (definition.groupBy === StatisticGroupBy.STATUS) {
    const selected = definition.statusIds.length
      ? source.statuses.filter((status) =>
          definition.statusIds.includes(status.id),
        )
      : source.statuses;
    return { groups: groupByStatus(tasks, selected), multiValue: false };
  }
  if (definition.groupBy === StatisticGroupBy.DATE) {
    return { groups: groupByDate(tasks, definition), multiValue: false };
  }
  const property = source.properties.find(
    (candidate) => candidate.id === definition.groupPropertyId,
  );
  if (!property) return { groups: [], multiValue: false };
  return {
    groups: groupByProperty(tasks, property),
    multiValue: property.type === 'MULTI_SELECT',
  };
}

/** Calculates one persisted widget from the complete source history. */
function buildWidget(
  definition: StatisticDefinition,
  source: StatisticsSource,
  now: Date,
): StatisticWidgetResult {
  const availableStatuses = new Set(source.statuses.map((status) => status.id));
  const safeDefinition = {
    ...definition,
    statusIds: definition.statusIds.filter((id) => availableStatuses.has(id)),
  };
  const tasks = filterTasks(source.tasks, safeDefinition, now);
  const calculation = calculateMeasure(tasks, safeDefinition, now);
  if (safeDefinition.groupBy === StatisticGroupBy.NONE) {
    return {
      definition: safeDefinition,
      result: { kind: 'KPI', ...calculation },
    };
  }
  const { groups, multiValue } = getGroups(tasks, safeDefinition, source);
  return {
    definition: safeDefinition,
    result: {
      format: calculation.format,
      kind: 'CHART',
      multiValue,
      values: groups.map((group) => {
        const result = calculateMeasure(group.tasks, safeDefinition, now);
        return {
          color: group.color,
          label: group.label,
          percentage: tasks.length
            ? (group.tasks.length / tasks.length) * 100
            : 0,
          taskCount: group.tasks.length,
          value: result.value,
        };
      }),
    },
  };
}

/** Produces the complete serializable configurable statistics projection. */
export function buildStatisticsSnapshot(
  source: StatisticsSource,
  now = new Date(),
): StatisticsSnapshot {
  return {
    properties: source.properties,
    statistics: source.statistics.map((definition) =>
      buildWidget(definition, source, now),
    ),
    statuses: source.statuses,
    taskCount: source.tasks.length,
  };
}
