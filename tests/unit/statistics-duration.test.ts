import { formatResolutionDuration } from '@/components/statistics/duration';
import { describe, expect, it } from 'vitest';

describe('formatResolutionDuration', () => {
  /** Proves missing data remains explicit in both supported languages. */
  it('formats an unavailable mean', () => {
    expect(formatResolutionDuration(null, 'en')).toBe('Not available');
    expect(formatResolutionDuration(null, 'es')).toBe('No disponible');
  });

  /** Proves the formatter selects readable minute, hour, and day units. */
  it('chooses the largest useful localized unit', () => {
    expect(formatResolutionDuration(30 * 60_000, 'en')).toBe('30 minutes');
    expect(formatResolutionDuration(90 * 60_000, 'es')).toBe('1,5 horas');
    expect(formatResolutionDuration(60 * 60 * 60_000, 'en')).toBe('2.5 days');
  });
});
