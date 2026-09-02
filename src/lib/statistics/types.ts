import type { TaskPropertyType } from '@/generated/prisma';
import type { TaskPropertyValueData } from '@/lib/properties/types';

/** Completed task fields required to calculate analytics. */
export interface CompletedTaskRecord {
  createdAt: Date;
  completedAt: Date;
  propertyValues: TaskPropertyValueData[];
}

/** Selectable property fields required to build a breakdown. */
export interface SelectablePropertyRecord {
  id: string;
  name: string;
  type: Extract<TaskPropertyType, 'SELECT' | 'MULTI_SELECT'>;
  position: number;
  options: string[];
}

/** Persistence-neutral source used by the statistics service. */
export interface StatisticsSource {
  completedTasks: CompletedTaskRecord[];
  properties: SelectablePropertyRecord[];
}

/** One visible option in a custom-property distribution. */
export interface PropertyStatisticValue {
  label: string | null;
  count: number;
  percentage: number;
}

/** Completed-task distribution for one configurable property. */
export interface PropertyStatistic {
  propertyId: string;
  name: string;
  type: SelectablePropertyRecord['type'];
  assignedTaskCount: number;
  values: PropertyStatisticValue[];
}

/** Serializable analytics projection consumed by the statistics page. */
export interface StatisticsSnapshot {
  averageResolutionTimeMs: number | null;
  completedTaskCount: number;
  properties: PropertyStatistic[];
}
