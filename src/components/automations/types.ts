import type { PropertyDefinition } from '@/lib/properties/types';
import type {
  AutomationActionType,
  AutomationDefinition,
  AutomationTriggerType,
} from '@/lib/automations/types';
import type { TaskPropertyValueData } from '@/lib/properties/types';

export type { AutomationDefinition, PropertyDefinition };

/** Serializable workflow state needed by the automation builder. */
export interface AutomationStatus {
  id: string;
  name: string;
  color: string;
  position: number;
  isTerminal: boolean;
}

/** Editable values for one status-change or scheduled automation. */
export interface AutomationValues {
  name: string;
  triggerType: AutomationTriggerType;
  triggerStatusId: string | null;
  scheduledAt: string | null;
  actionType: AutomationActionType;
  propertyId: string | null;
  propertyValue: TaskPropertyValueData['value'] | null;
  taskTitleTemplate: string | null;
  taskDescriptionTemplate: string | null;
  taskStatusId: string | null;
  taskDueDateOffsetDays: number | null;
  taskPropertyValues: TaskPropertyValueData[];
}

/** Result returned by an automation mutation callback. */
export interface AutomationMutationResult {
  success: boolean;
  error?: string;
}
