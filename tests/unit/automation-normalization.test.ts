import { describe, expect, it } from 'vitest';

import { normalizeAutomationInput } from '@/lib/automations/normalization';

describe('normalizeAutomationInput', () => {
  /** Prevents hidden scheduled-template fields from reaching transition storage. */
  it('clears scheduled fields from a status-change rule', () => {
    expect(
      normalizeAutomationInput({
        actionType: 'SET_COMPLETION_DATE_TODAY',
        name: 'Complete work',
        scheduledAt: '2026-09-04T00:00:00.000Z',
        taskDescriptionTemplate: 'Stale description',
        taskDueDateOffsetDays: 3,
        taskPropertyValues: [{ propertyId: 'priority', value: 'High' }],
        taskStatusId: 'todo',
        taskTitleTemplate: 'Stale title',
        triggerStatusId: 'done',
        triggerType: 'STATUS_CHANGE',
      }),
    ).toMatchObject({
      scheduledAt: null,
      taskDescriptionTemplate: null,
      taskDueDateOffsetDays: null,
      taskPropertyValues: [],
      taskStatusId: null,
      taskTitleTemplate: null,
    });
  });

  /** Prevents transition property payloads from reaching scheduled storage. */
  it('clears transition fields from a scheduled rule', () => {
    expect(
      normalizeAutomationInput({
        actionType: 'CREATE_TASK',
        name: 'Review',
        propertyId: 'priority',
        propertyValue: 'High',
        scheduledAt: '2026-09-04T00:00:00.000Z',
        taskStatusId: 'todo',
        taskTitleTemplate: 'Review',
        triggerStatusId: 'done',
        triggerType: 'SCHEDULED',
      }),
    ).toMatchObject({
      propertyId: null,
      propertyValue: null,
      triggerStatusId: null,
    });
  });
});
