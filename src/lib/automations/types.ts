import type {
  AutomationActionType,
  AutomationTriggerType,
} from '@/generated/prisma';
import type {
  PropertyValue,
  TaskPropertyValueInput,
} from '@/lib/properties/types';

export type { AutomationActionType, AutomationTriggerType };

/** Public, serializable automation definition used by the board and settings. */
export type AutomationDefinition = {
  id: string;
  name: string;
  triggerType: AutomationTriggerType;
  triggerStatusId: string | null;
  scheduledAt: string | null;
  executedAt: string | null;
  actionType: AutomationActionType;
  propertyId: string | null;
  propertyValue: PropertyValue | null;
  taskTitleTemplate: string | null;
  taskDescriptionTemplate: string | null;
  taskStatusId: string | null;
  taskDueDateOffsetDays: number | null;
  taskPropertyValues: TaskPropertyValueInput[];
};

/** Validated fields accepted when creating an automation. */
export type CreateAutomationInput = {
  name: string;
  triggerType: AutomationTriggerType;
  triggerStatusId?: string | null;
  scheduledAt?: string | Date | null;
  actionType: AutomationActionType;
  propertyId?: string | null;
  propertyValue?: PropertyValue | null;
  taskTitleTemplate?: string | null;
  taskDescriptionTemplate?: string | null;
  taskStatusId?: string | null;
  taskDueDateOffsetDays?: number | null;
  taskPropertyValues?: TaskPropertyValueInput[];
};

/** Validated fields accepted when editing an automation. */
export type UpdateAutomationInput = CreateAutomationInput & { id: string };
