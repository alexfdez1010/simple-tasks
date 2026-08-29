import { describe, expect, it } from 'vitest';

import {
  colorSchema,
  idSchema,
  indexSchema,
  parseNullableDate,
} from '@/lib/validation/common';

describe('common input validation', () => {
  /** Proves identifiers are trimmed and constrained to database-safe lengths. */
  it('accepts bounded identifiers and rejects blank or oversized values', () => {
    expect(idSchema.parse('  task-id  ')).toBe('task-id');
    expect(idSchema.safeParse('   ').success).toBe(false);
    expect(idSchema.safeParse('x'.repeat(192)).success).toBe(false);
  });

  /** Proves status colors use an exact six-digit hexadecimal contract. */
  it('accepts CSS hex colors and rejects ambiguous color strings', () => {
    expect(colorSchema.parse('#a1B2c3')).toBe('#a1B2c3');
    for (const invalid of ['red', '#fff', '#12345678', '123456']) {
      expect(colorSchema.safeParse(invalid).success).toBe(false);
    }
  });

  /** Proves ordering positions cannot be fractional or negative. */
  it('accepts only non-negative integer positions', () => {
    expect(indexSchema.parse(0)).toBe(0);
    expect(indexSchema.safeParse(-1).success).toBe(false);
    expect(indexSchema.safeParse(1.5).success).toBe(false);
  });

  /** Proves nullable dates normalize empty inputs and preserve valid values. */
  it('normalizes optional dates', () => {
    expect(parseNullableDate(null)).toBeNull();
    expect(parseNullableDate(undefined)).toBeNull();
    expect(parseNullableDate('')).toBeNull();
    expect(parseNullableDate('2026-09-05')).toEqual(
      new Date('2026-09-05T00:00:00.000Z'),
    );
  });

  /** Proves invalid dates fail at the validation boundary. */
  it('rejects invalid dates', () => {
    expect(() => parseNullableDate('not-a-date')).toThrow(
      'The date is invalid.',
    );
  });
});
