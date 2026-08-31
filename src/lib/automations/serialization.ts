import type { Prisma, Automation } from '@/generated/prisma';
import type { AutomationDefinition } from '@/lib/automations/types';
import type { PropertyValue } from '@/lib/properties/types';
import { conflict } from '@/lib/validation/errors';

/** Converts stored JSON into a safe automation property value. */
function deserializeValue(
  value: Prisma.JsonValue | null,
): PropertyValue | null {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value as string[];
  }
  throw conflict('The stored automation value is invalid.');
}

/** Removes persistence timestamps from the client-facing automation contract. */
export function serializeAutomation(
  automation: Automation,
): AutomationDefinition {
  return {
    id: automation.id,
    name: automation.name,
    triggerStatusId: automation.triggerStatusId,
    actionType: automation.actionType,
    propertyId: automation.propertyId,
    propertyValue: deserializeValue(automation.propertyValue),
  };
}
