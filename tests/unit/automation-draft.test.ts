import { describe, expect, it } from 'vitest';

import {
  changeAutomationAction,
  changeAutomationTrigger,
  createAutomationDraft,
  normalizeAutomationValues,
  toAutomationInput,
  validateAutomationValues,
} from '@/components/automations/automation-draft';
import type {
  AutomationStatus,
  AutomationValues,
} from '@/components/automations/types';

const STATUSES: AutomationStatus[] = [
  {
    color: '#64748b',
    id: 'todo',
    isTerminal: false,
    name: 'To do',
    position: 0,
  },
  {
    color: '#22c55e',
    id: 'done',
    isTerminal: true,
    name: 'Done',
    position: 1,
  },
];

/** Creates a fully populated scheduled draft for normalization cases. */
function scheduledDraft(): AutomationValues {
  return {
    ...createAutomationDraft(STATUSES),
    actionType: 'CREATE_TASK',
    name: '  Monthly review  ',
    scheduledAt: '2026-09-04',
    taskDescriptionTemplate: 'Review {{date}}',
    taskDueDateOffsetDays: 2,
    taskStatusId: 'todo',
    taskTitleTemplate: 'Review {{date}}',
    triggerType: 'SCHEDULED',
  };
}

describe('automation draft logic', () => {
  /** Defaults transition rules to the first terminal workflow state. */
  it('creates a useful completion-date draft', () => {
    expect(createAutomationDraft(STATUSES)).toMatchObject({
      actionType: 'SET_COMPLETION_DATE_TODAY',
      taskStatusId: 'todo',
      triggerStatusId: 'done',
      triggerType: 'STATUS_CHANGE',
    });
  });

  /** Removes hidden transition fields when switching to a scheduled task. */
  it('normalizes the draft when the trigger changes to scheduled', () => {
    const propertyDraft: AutomationValues = {
      ...createAutomationDraft(STATUSES),
      actionType: 'SET_PROPERTY_VALUE',
      propertyId: 'priority',
      propertyValue: 'High',
    };

    expect(
      changeAutomationTrigger(propertyDraft, 'SCHEDULED', STATUSES),
    ).toMatchObject({
      actionType: 'CREATE_TASK',
      propertyId: null,
      propertyValue: null,
      taskStatusId: 'todo',
      triggerStatusId: null,
    });
  });

  /** Removes hidden scheduled template fields when returning to transitions. */
  it('normalizes the draft when the trigger returns to status change', () => {
    expect(
      changeAutomationTrigger(scheduledDraft(), 'STATUS_CHANGE', STATUSES),
    ).toMatchObject({
      actionType: 'SET_COMPLETION_DATE_TODAY',
      scheduledAt: null,
      taskDescriptionTemplate: null,
      taskDueDateOffsetDays: null,
      taskStatusId: null,
      taskTitleTemplate: null,
      triggerStatusId: 'done',
    });
  });

  /** Clears property payloads when choosing the completion-date action. */
  it('removes an incompatible property value when the action changes', () => {
    const values: AutomationValues = {
      ...createAutomationDraft(STATUSES),
      actionType: 'SET_PROPERTY_VALUE',
      propertyId: 'priority',
      propertyValue: 'High',
    };
    expect(
      changeAutomationAction(values, 'SET_COMPLETION_DATE_TODAY'),
    ).toMatchObject({ propertyId: null, propertyValue: null });
  });

  /** Trims names and produces the exact UTC API schedule representation. */
  it('converts normalized editor values into an API input', () => {
    expect(toAutomationInput(scheduledDraft())).toMatchObject({
      name: 'Monthly review',
      scheduledAt: '2026-09-04T00:00:00.000Z',
      triggerStatusId: null,
    });
  });

  /** Reports the first missing field for every supported rule shape. */
  it('validates required trigger and action fields', () => {
    const empty = createAutomationDraft(STATUSES);
    expect(validateAutomationValues(empty)).toBe('name');
    expect(
      validateAutomationValues({
        ...empty,
        name: 'Rule',
        triggerStatusId: null,
      }),
    ).toBe('triggerStatus');
    expect(
      validateAutomationValues({
        ...scheduledDraft(),
        scheduledAt: null,
      }),
    ).toBe('scheduledDate');
    expect(
      validateAutomationValues({
        ...empty,
        actionType: 'SET_PROPERTY_VALUE',
        name: 'Property rule',
      }),
    ).toBe('propertyValue');
    expect(normalizeAutomationValues(scheduledDraft()).name).toBe(
      'Monthly review',
    );
  });
});
