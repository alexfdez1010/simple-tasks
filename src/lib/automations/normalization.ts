import type {
  CreateAutomationInput,
  UpdateAutomationInput,
} from '@/lib/automations/types';

/** Removes fields that are irrelevant to the validated automation shape. */
export function normalizeAutomationInput<
  T extends CreateAutomationInput | UpdateAutomationInput,
>(input: T): T {
  if (input.triggerType === 'SCHEDULED') {
    return {
      ...input,
      triggerStatusId: null,
      propertyId: null,
      propertyValue: null,
    } as T;
  }
  return {
    ...input,
    scheduledAt: null,
    propertyId:
      input.actionType === 'SET_PROPERTY_VALUE' ? input.propertyId : null,
    propertyValue:
      input.actionType === 'SET_PROPERTY_VALUE' ? input.propertyValue : null,
    taskTitleTemplate: null,
    taskDescriptionTemplate: null,
    taskStatusId: null,
    taskDueDateOffsetDays: null,
    taskPropertyValues: [],
  } as T;
}
