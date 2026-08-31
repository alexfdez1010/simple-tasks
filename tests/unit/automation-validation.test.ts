import { describe, expect, it } from 'vitest';

import { automationSchema } from '@/lib/automations/validation';

describe('automationSchema', () => {
  /** Accepts the guaranteed completion-date automation shape. */
  it('accepts a completion-date action without a property', () => {
    expect(
      automationSchema.parse({
        actionType: 'SET_COMPLETION_DATE_TODAY',
        name: 'Complete on Done',
        triggerStatusId: 'done',
      }),
    ).toMatchObject({ actionType: 'SET_COMPLETION_DATE_TODAY' });
  });

  /** Requires both halves of a typed property assignment. */
  it('rejects a property action without a value', () => {
    expect(() =>
      automationSchema.parse({
        actionType: 'SET_PROPERTY_VALUE',
        name: 'Set priority',
        propertyId: 'priority',
        triggerStatusId: 'done',
      }),
    ).toThrow();
  });

  /** Prevents unrelated fields from silently changing a completion rule. */
  it('rejects property fields on a completion-date action', () => {
    expect(() =>
      automationSchema.parse({
        actionType: 'SET_COMPLETION_DATE_TODAY',
        name: 'Complete on Done',
        propertyId: 'priority',
        propertyValue: 'High',
        triggerStatusId: 'done',
      }),
    ).toThrow();
  });
});
