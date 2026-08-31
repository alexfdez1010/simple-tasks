import type { AutomationActionType } from '@/generated/prisma';
import type { PropertyValue } from '@/lib/properties/types';

export type { AutomationActionType };

/** Public, serializable automation definition used by the board and settings. */
export type AutomationDefinition = {
  id: string;
  name: string;
  triggerStatusId: string;
  actionType: AutomationActionType;
  propertyId: string | null;
  propertyValue: PropertyValue | null;
};

/** Validated fields accepted when creating an automation. */
export type CreateAutomationInput = {
  name: string;
  triggerStatusId: string;
  actionType: AutomationActionType;
  propertyId?: string | null;
  propertyValue?: PropertyValue | null;
};

/** Validated fields accepted when editing an automation. */
export type UpdateAutomationInput = CreateAutomationInput & { id: string };
