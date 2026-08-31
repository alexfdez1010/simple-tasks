import { describe, expect, it } from 'vitest';

import {
  getScheduledDueDate,
  renderAutomationTemplate,
} from '@/lib/automations/template';

describe('scheduled automation templates', () => {
  /** Replaces both supported date parameters with stable UTC values. */
  it('renders scheduled date parameters', () => {
    const scheduledAt = new Date('2026-08-30T09:15:00.000Z');

    expect(
      renderAutomationTemplate('Review {{date}} · {{datetime}}', scheduledAt),
    ).toBe('Review 2026-08-30 · 2026-08-30T09:15:00.000Z');
  });

  /** Applies the configured offset without local-time drift. */
  it('calculates due dates in UTC', () => {
    expect(
      getScheduledDueDate(
        new Date('2026-08-30T00:00:00.000Z'),
        2,
      ).toISOString(),
    ).toBe('2026-09-01T00:00:00.000Z');
  });
});
