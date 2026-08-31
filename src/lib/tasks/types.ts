import type { Status, Task } from '@/generated/prisma';
import type {
  PropertyDefinition,
  TaskPropertyValueData,
  TaskPropertyValueInput,
} from '@/lib/properties/types';
import type { AutomationDefinition } from '@/lib/automations/types';

export type TaskWithProperties = Task & {
  propertyValues: TaskPropertyValueData[];
};
export type BoardStatus = Status & { tasks: TaskWithProperties[] };
export type TaskWithStatus = TaskWithProperties & { status: Status };
export type BoardSnapshot = {
  statuses: BoardStatus[];
  properties: PropertyDefinition[];
  automations: AutomationDefinition[];
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  dueDate?: string | Date | null;
  statusId?: string;
  propertyValues?: TaskPropertyValueInput[];
};

export type UpdateTaskInput = {
  id: string;
  title?: string;
  description?: string | null;
  dueDate?: string | Date | null;
  statusId?: string;
  index?: number;
  propertyValues?: TaskPropertyValueInput[];
};

export type MoveTaskInput = { id: string; statusId: string; index: number };
export type ReorderTasksInput = { statusId: string; taskIds: string[] };
