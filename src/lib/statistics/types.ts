import type {
  StatisticDateBucket,
  StatisticDateField,
  StatisticGroupBy,
  StatisticMeasure,
  StatisticScope,
  StatisticVisualization,
  TaskPropertyType,
} from '@/generated/prisma';
import type {
  PropertyDefinition,
  TaskPropertyValueData,
} from '@/lib/properties/types';

/** One task record containing only fields required by analytics. */
export interface StatisticTaskRecord {
  completedAt: Date | null;
  createdAt: Date;
  dueDate: Date | null;
  id: string;
  propertyValues: TaskPropertyValueData[];
  statusId: string;
  updatedAt: Date;
}

/** One workflow state exposed to statistic dimensions and filters. */
export interface StatisticStatusRecord {
  color: string;
  id: string;
  isTerminal: boolean;
  name: string;
  position: number;
}

/** A persisted, transport-safe statistic definition. */
export interface StatisticDefinition {
  dateBucket: StatisticDateBucket | null;
  dateField: StatisticDateField | null;
  datePropertyId: string | null;
  groupBy: StatisticGroupBy;
  groupPropertyId: string | null;
  id: string;
  measure: StatisticMeasure;
  measurePropertyId: string | null;
  name: string;
  position: number;
  scope: StatisticScope;
  statusIds: string[];
  visualization: StatisticVisualization;
}

/** Fields accepted when creating a statistic definition. */
export type CreateStatisticInput = Omit<StatisticDefinition, 'id' | 'position'>;

/** Partial fields accepted when editing a statistic definition. */
export type UpdateStatisticInput = Partial<CreateStatisticInput> & {
  id: string;
};

/** Exact ordered membership accepted by the reorder use case. */
export interface ReorderStatisticsInput {
  statisticIds: string[];
}

/** Property and status metadata used to validate configurable dimensions. */
export interface StatisticsCatalog {
  properties: PropertyDefinition[];
  statuses: StatisticStatusRecord[];
}

/** Persistence-neutral data needed to calculate the configured canvas. */
export interface StatisticsSource extends StatisticsCatalog {
  statistics: StatisticDefinition[];
  statuses: StatisticStatusRecord[];
  tasks: StatisticTaskRecord[];
}

/** Display formats supported by statistic cards and charts. */
export type StatisticValueFormat = 'DURATION' | 'NUMBER' | 'PERCENTAGE';

/** One calculated category or time bucket in a chart. */
export interface StatisticSeriesValue {
  color: string | null;
  label: string | null;
  percentage: number;
  taskCount: number;
  value: number | null;
}

/** Calculated scalar output for a KPI card. */
export interface StatisticKpiResult {
  format: StatisticValueFormat;
  kind: 'KPI';
  sampleSize: number;
  value: number | null;
}

/** Calculated categorical or temporal output for a chart card. */
export interface StatisticChartResult {
  format: StatisticValueFormat;
  kind: 'CHART';
  multiValue: boolean;
  values: StatisticSeriesValue[];
}

/** One persisted definition paired with its current calculated result. */
export interface StatisticWidgetResult {
  definition: StatisticDefinition;
  result: StatisticChartResult | StatisticKpiResult;
}

/** Serializable projection rendered by the configurable statistics page. */
export interface StatisticsSnapshot {
  properties: PropertyDefinition[];
  statistics: StatisticWidgetResult[];
  statuses: StatisticStatusRecord[];
  taskCount: number;
}

/** Property catalog lookup used by statistic compatibility validation. */
export type StatisticPropertyRecord = Pick<
  PropertyDefinition,
  'id' | 'name' | 'options' | 'position' | 'type'
> & { type: TaskPropertyType };
