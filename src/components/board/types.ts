import type { TaskPropertyType } from '@/generated/prisma';
import type {
  PropertyDefinition,
  TaskPropertyValueData,
} from '@/lib/properties/types';
import type {
  AutomationActionType,
  AutomationDefinition,
} from '@/lib/automations/types';

export type { PropertyDefinition, TaskPropertyValueData };
export type { AutomationActionType, AutomationDefinition };

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
  createdAt?: string;
  completedAt?: string | null;
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

/** Form values for a status-transition automation. */
export interface AutomationValues {
  name: string;
  triggerStatusId: string;
  actionType: AutomationActionType;
  propertyId: string | null;
  propertyValue: TaskPropertyValueData['value'] | null;
}

/** Result returned by a UI mutation callback. */
export interface MutationResult {
  success: boolean;
  error?: string;
}
