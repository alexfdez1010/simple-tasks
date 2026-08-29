import type { TaskPropertyType } from '@/generated/prisma';
import type {
  PropertyDefinition,
  TaskPropertyValueData,
} from '@/lib/properties/types';

export type { PropertyDefinition, TaskPropertyValueData };

/** Serializable workflow state consumed by the client-side board. */
export interface BoardStatus {
  id: string;
  name: string;
  color: string;
  position: number;
  isTerminal: boolean;
  tasks: BoardTask[];
}

/** Serializable task consumed by the client-side board. */
export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  statusId: string;
  position: number;
  updatedAt: string;
  propertyValues: TaskPropertyValueData[];
}

/** Values accepted by the create and edit task forms. */
export interface TaskValues {
  title: string;
  description: string;
  dueDate: string;
  statusId: string;
  propertyValues?: TaskPropertyValueData[];
}

/** Editable values accepted by the property-definition form. */
export interface PropertyValues {
  name: string;
  type: TaskPropertyType;
  options: string[];
}

/** Values accepted by the create and edit status forms. */
export interface StatusValues {
  name: string;
  color: string;
  isTerminal: boolean;
}

/** Result returned by a UI mutation callback. */
export interface MutationResult {
  success: boolean;
  error?: string;
}
