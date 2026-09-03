import {
  StatisticDateBucket,
  StatisticDateField,
  StatisticDateRange,
  StatisticGroupBy,
  StatisticMeasure,
  StatisticScope,
  StatisticVisualization,
  TaskPropertyType,
} from '@/generated/prisma';
import { MAX_STATISTICS } from '@/lib/statistics/limits';
import type {
  CreateStatisticInput,
  StatisticDefinition,
  StatisticPropertyRecord,
  StatisticStatusRecord,
  UpdateStatisticInput,
} from '@/lib/statistics/types';
import { idSchema } from '@/lib/validation/common';
import { conflict } from '@/lib/validation/errors';
import { z } from 'zod';

const nullableId = idSchema.nullable();
const numericMeasures = new Set<StatisticMeasure>([
  StatisticMeasure.SUM,
  StatisticMeasure.AVERAGE,
  StatisticMeasure.MINIMUM,
  StatisticMeasure.MAXIMUM,
]);

export const createStatisticSchema = z.object({
  dateBucket: z.nativeEnum(StatisticDateBucket).nullable(),
  dateField: z.nativeEnum(StatisticDateField).nullable(),
  datePropertyId: nullableId,
  dateRange: z.nativeEnum(StatisticDateRange),
  groupBy: z.nativeEnum(StatisticGroupBy),
  groupPropertyId: nullableId,
  measure: z.nativeEnum(StatisticMeasure),
  measurePropertyId: nullableId,
  name: z.string().trim().min(1).max(100),
  scope: z.nativeEnum(StatisticScope),
  statusIds: z.array(idSchema).max(50),
  visualization: z.nativeEnum(StatisticVisualization),
});

export const updateStatisticSchema = createStatisticSchema.partial().extend({
  id: idSchema,
});

export const reorderStatisticsSchema = z.object({
  statisticIds: z.array(idSchema).max(MAX_STATISTICS),
});

/** Finds one property or rejects a dangling statistic reference. */
function requireProperty(
  properties: StatisticPropertyRecord[],
  id: string | null,
  role: string,
): StatisticPropertyRecord {
  const property = properties.find((candidate) => candidate.id === id);
  if (!property)
    throw conflict(`The statistic ${role} property does not exist.`);
  return property;
}

/** Enforces visualization, measure, dimension, and catalog compatibility. */
export function normalizeStatisticDefinition(
  input: CreateStatisticInput,
  properties: StatisticPropertyRecord[],
  statuses: StatisticStatusRecord[],
): CreateStatisticInput {
  const groupBy =
    input.visualization === StatisticVisualization.KPI
      ? StatisticGroupBy.NONE
      : input.groupBy;
  if (
    input.visualization !== StatisticVisualization.KPI &&
    groupBy === 'NONE'
  ) {
    throw conflict('Charts require a status, property, or date dimension.');
  }
  if (
    input.visualization === StatisticVisualization.LINE &&
    groupBy !== 'DATE'
  ) {
    throw conflict('Line charts require a date dimension.');
  }
  if (
    input.visualization === StatisticVisualization.DONUT &&
    groupBy === 'DATE'
  ) {
    throw conflict('Donut charts do not support a date dimension.');
  }

  const measurePropertyId = numericMeasures.has(input.measure)
    ? input.measurePropertyId
    : null;
  if (numericMeasures.has(input.measure)) {
    const property = requireProperty(properties, measurePropertyId, 'measure');
    if (property.type !== TaskPropertyType.NUMBER) {
      throw conflict('Numeric measures require a number property.');
    }
  }

  const groupPropertyId = groupBy === 'PROPERTY' ? input.groupPropertyId : null;
  if (groupBy === 'PROPERTY') {
    const property = requireProperty(properties, groupPropertyId, 'group');
    if (property.type === TaskPropertyType.DATE) {
      throw conflict('Date properties must use the date dimension.');
    }
  }

  const usesDate =
    groupBy === StatisticGroupBy.DATE ||
    input.dateRange !== StatisticDateRange.ALL_TIME;
  const dateField = usesDate ? input.dateField : null;
  const dateBucket = groupBy === 'DATE' ? input.dateBucket : null;
  if (usesDate && !dateField) {
    throw conflict('Date periods require a date field.');
  }
  if (groupBy === 'DATE' && !dateBucket) {
    throw conflict('Date dimensions require a field and time bucket.');
  }
  const datePropertyId = dateField === 'PROPERTY' ? input.datePropertyId : null;
  if (dateField === 'PROPERTY') {
    const property = requireProperty(properties, datePropertyId, 'date');
    if (property.type !== TaskPropertyType.DATE) {
      throw conflict('Date dimensions require a date property.');
    }
  }

  const availableStatuses = new Set(statuses.map((status) => status.id));
  const statusIds = [...new Set(input.statusIds)];
  if (statusIds.some((id) => !availableStatuses.has(id))) {
    throw conflict('The statistic status filter contains an unknown status.');
  }
  return {
    ...input,
    dateBucket,
    dateField,
    datePropertyId,
    groupBy,
    groupPropertyId,
    measurePropertyId,
    name: input.name.trim(),
    statusIds,
  };
}

/** Merges a partial edit with its persisted definition. */
export function mergeStatisticUpdate(
  current: StatisticDefinition,
  update: UpdateStatisticInput,
): CreateStatisticInput {
  const persisted: CreateStatisticInput = {
    dateBucket: current.dateBucket,
    dateField: current.dateField,
    datePropertyId: current.datePropertyId,
    dateRange: current.dateRange,
    groupBy: current.groupBy,
    groupPropertyId: current.groupPropertyId,
    measure: current.measure,
    measurePropertyId: current.measurePropertyId,
    name: current.name,
    scope: current.scope,
    statusIds: current.statusIds,
    visualization: current.visualization,
  };
  const changes = Object.fromEntries(
    Object.entries(update).filter(([key]) => key !== 'id'),
  ) as Partial<CreateStatisticInput>;
  return { ...persisted, ...changes };
}
