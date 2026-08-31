import type { Automation, Prisma } from '@/generated/prisma';
import type { AutomationDefinition } from '@/lib/automations/types';
import type {
  PropertyValue,
  TaskPropertyValueData,
} from '@/lib/properties/types';
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

/** Converts stored scheduled property templates into safe public values. */
export function deserializeTaskPropertyValues(
  value: Prisma.JsonValue | null,
): TaskPropertyValueData[] {
  if (value === null) return [];
  if (!Array.isArray(value))
    throw conflict('The stored task template is invalid.');
  return value.map((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry))
      throw conflict('The stored task template is invalid.');
    const propertyId = entry.propertyId;
    if (typeof propertyId !== 'string')
      throw conflict('The stored task template is invalid.');
    return {
      propertyId,
      value: deserializeValue(entry.value ?? null),
    } as TaskPropertyValueData;
  });
}

/** Removes persistence timestamps from the client-facing automation contract. */
export function serializeAutomation(
  automation: Automation,
): AutomationDefinition {
  return {
    id: automation.id,
    name: automation.name,
    triggerType: automation.triggerType,
    triggerStatusId: automation.triggerStatusId,
    scheduledAt: automation.scheduledAt?.toISOString() ?? null,
    executedAt: automation.executedAt?.toISOString() ?? null,
    actionType: automation.actionType,
    propertyId: automation.propertyId,
    propertyValue: deserializeValue(automation.propertyValue),
    taskTitleTemplate: automation.taskTitleTemplate,
    taskDescriptionTemplate: automation.taskDescriptionTemplate,
    taskStatusId: automation.taskStatusId,
    taskDueDateOffsetDays: automation.taskDueDateOffsetDays,
    taskPropertyValues: deserializeTaskPropertyValues(
      automation.taskPropertyValues,
    ),
  };
}
