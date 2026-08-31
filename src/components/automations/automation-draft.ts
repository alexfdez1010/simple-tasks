import type {
  AutomationDefinition,
  AutomationStatus,
  AutomationValues,
} from '@/components/automations/types';
import { normalizeAutomationInput } from '@/lib/automations/normalization';

export type AutomationValidationIssue =
  'name' | 'triggerStatus' | 'scheduledDate' | 'taskTemplate' | 'propertyValue';

/** Creates a predictable rule draft from the available workflow states. */
export function createAutomationDraft(
  statuses: AutomationStatus[],
): AutomationValues {
  return {
    name: '',
    triggerType: 'STATUS_CHANGE',
    triggerStatusId:
      statuses.find((status) => status.isTerminal)?.id ??
      statuses[0]?.id ??
      null,
    scheduledAt: null,
    actionType: 'SET_COMPLETION_DATE_TODAY',
    propertyId: null,
    propertyValue: null,
    taskTitleTemplate: null,
    taskDescriptionTemplate: null,
    taskStatusId: statuses[0]?.id ?? null,
    taskDueDateOffsetDays: 0,
    taskPropertyValues: [],
  };
}

/** Converts a persisted definition into calendar-oriented editor values. */
export function automationToDraft(
  automation: AutomationDefinition,
): AutomationValues {
  return {
    ...automation,
    scheduledAt: automation.scheduledAt?.slice(0, 10) ?? null,
  };
}

/** Switches trigger mode while clearing fields hidden by the new mode. */
export function changeAutomationTrigger(
  values: AutomationValues,
  triggerType: AutomationValues['triggerType'],
  statuses: AutomationStatus[],
): AutomationValues {
  if (triggerType === 'SCHEDULED') {
    return normalizeAutomationValues({
      ...values,
      triggerType,
      actionType: 'CREATE_TASK',
      taskStatusId: values.taskStatusId ?? statuses[0]?.id ?? null,
    });
  }
  return normalizeAutomationValues({
    ...values,
    triggerType,
    actionType: 'SET_COMPLETION_DATE_TODAY',
    triggerStatusId:
      values.triggerStatusId ??
      statuses.find((status) => status.isTerminal)?.id ??
      statuses[0]?.id ??
      null,
  });
}

/** Switches a transition action while removing incompatible property data. */
export function changeAutomationAction(
  values: AutomationValues,
  actionType: AutomationValues['actionType'],
): AutomationValues {
  return normalizeAutomationValues({ ...values, actionType });
}

/** Removes stale fields that do not belong to the selected rule shape. */
export function normalizeAutomationValues(
  values: AutomationValues,
): AutomationValues {
  return normalizeAutomationInput({
    ...values,
    name: values.name.trim(),
  }) as AutomationValues;
}

/** Returns the first actionable editor validation issue, if one exists. */
export function validateAutomationValues(
  values: AutomationValues,
): AutomationValidationIssue | null {
  if (!values.name.trim()) return 'name';
  if (values.triggerType === 'STATUS_CHANGE' && !values.triggerStatusId) {
    return 'triggerStatus';
  }
  if (values.triggerType === 'SCHEDULED' && !values.scheduledAt) {
    return 'scheduledDate';
  }
  if (
    values.triggerType === 'SCHEDULED' &&
    (!values.taskTitleTemplate?.trim() || !values.taskStatusId)
  ) {
    return 'taskTemplate';
  }
  if (
    values.actionType === 'SET_PROPERTY_VALUE' &&
    (!values.propertyId || values.propertyValue === null)
  ) {
    return 'propertyValue';
  }
  return null;
}

/** Converts a local calendar date into the UTC instant accepted by the API. */
export function toAutomationInput(values: AutomationValues): AutomationValues {
  const normalized = normalizeAutomationValues(values);
  return {
    ...normalized,
    scheduledAt: normalized.scheduledAt
      ? `${normalized.scheduledAt}T00:00:00.000Z`
      : null,
  };
}
