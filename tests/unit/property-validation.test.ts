import { TaskPropertyType } from '@/generated/prisma';
import {
  createPropertySchema,
  isSelectableProperty,
  parsePropertyValue,
  setTaskPropertyValueSchema,
} from '@/lib/validation/properties';
import { describe, expect, it } from 'vitest';

describe('configurable property validation', () => {
  /** Proves definition names and options are normalized before persistence. */
  it('trims selectable property definitions and retains option order', () => {
    expect(
      createPropertySchema.parse({
        name: '  Priority  ',
        options: [' High ', 'Medium', ' Low '],
        type: TaskPropertyType.SELECT,
      }),
    ).toEqual({
      name: 'Priority',
      options: ['High', 'Medium', 'Low'],
      type: TaskPropertyType.SELECT,
    });
  });

  /** Proves selectable definitions require non-empty, unique options. */
  it('rejects missing, blank, and duplicate selectable options', () => {
    for (const type of [
      TaskPropertyType.SELECT,
      TaskPropertyType.MULTI_SELECT,
    ]) {
      expect(
        createPropertySchema.safeParse({ name: 'Field', type }).success,
      ).toBe(false);
      expect(
        createPropertySchema.safeParse({ name: 'Field', options: ['  '], type })
          .success,
      ).toBe(false);
      expect(
        createPropertySchema.safeParse({
          name: 'Field',
          options: ['One', ' One '],
          type,
        }).success,
      ).toBe(false);
    }
  });

  /** Proves scalar definitions reject irrelevant selectable options. */
  it('rejects options for text, number, and date definitions', () => {
    for (const type of [
      TaskPropertyType.TEXT,
      TaskPropertyType.NUMBER,
      TaskPropertyType.DATE,
    ]) {
      expect(
        createPropertySchema.safeParse({
          name: 'Field',
          options: ['Irrelevant'],
          type,
        }).success,
      ).toBe(false);
    }
  });

  /** Proves TEXT preserves user content while enforcing its size and type limits. */
  it('normalizes TEXT values', () => {
    expect(
      parsePropertyValue(TaskPropertyType.TEXT, [], '  exact text  '),
    ).toBe('  exact text  ');
    expect(() =>
      parsePropertyValue(TaskPropertyType.TEXT, [], 'x'.repeat(20_001)),
    ).toThrow();
    expect(() => parsePropertyValue(TaskPropertyType.TEXT, [], 12)).toThrow();
  });

  /** Proves NUMBER accepts finite safe numbers and rejects unsafe representations. */
  it('normalizes NUMBER values', () => {
    for (const value of [0, -12.5, Number.MAX_SAFE_INTEGER]) {
      expect(parsePropertyValue(TaskPropertyType.NUMBER, [], value)).toBe(
        value,
      );
    }
    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
      '12',
    ]) {
      expect(() =>
        parsePropertyValue(TaskPropertyType.NUMBER, [], value),
      ).toThrow();
    }
  });

  /** Proves DATE accepts real calendar-only ISO values without rollover. */
  it('normalizes DATE values', () => {
    expect(parsePropertyValue(TaskPropertyType.DATE, [], '2024-02-29')).toBe(
      '2024-02-29',
    );
    for (const value of [
      '2025-02-29',
      '2026-04-31',
      '2026-8-01',
      '2026-08-01T00:00:00.000Z',
      new Date('2026-08-01'),
    ]) {
      expect(() =>
        parsePropertyValue(TaskPropertyType.DATE, [], value),
      ).toThrow();
    }
  });

  /** Proves SELECT requires one exact configured option. */
  it('normalizes SELECT values', () => {
    const options = ['High', 'Medium', 'Low'];
    expect(parsePropertyValue(TaskPropertyType.SELECT, options, 'Medium')).toBe(
      'Medium',
    );
    for (const value of ['medium', 'Other', ['Medium']]) {
      expect(() =>
        parsePropertyValue(TaskPropertyType.SELECT, options, value),
      ).toThrow();
    }
  });

  /** Proves MULTI_SELECT retains unique configured choices in caller order. */
  it('normalizes MULTI_SELECT values', () => {
    const options = ['Frontend', 'Backend', 'Infra'];
    expect(
      parsePropertyValue(TaskPropertyType.MULTI_SELECT, options, [
        'Infra',
        'Frontend',
      ]),
    ).toEqual(['Infra', 'Frontend']);
    expect(
      parsePropertyValue(TaskPropertyType.MULTI_SELECT, options, []),
    ).toEqual([]);
    expect(() =>
      parsePropertyValue(TaskPropertyType.MULTI_SELECT, options, [
        'Infra',
        'Infra',
      ]),
    ).toThrow();
    expect(() =>
      parsePropertyValue(TaskPropertyType.MULTI_SELECT, options, ['Unknown']),
    ).toThrow();
  });

  /** Proves the transport schema rejects unsupported JSON value shapes. */
  it('accepts only supported task property payload shapes', () => {
    expect(
      setTaskPropertyValueSchema.parse({
        propertyId: 'property-1',
        taskId: 'task-1',
        value: ['A', 'B'],
      }),
    ).toEqual({
      propertyId: 'property-1',
      taskId: 'task-1',
      value: ['A', 'B'],
    });
    expect(
      setTaskPropertyValueSchema.safeParse({
        propertyId: 'property-1',
        taskId: 'task-1',
        value: true,
      }).success,
    ).toBe(false);
  });

  /** Proves only SELECT variants expose configurable options. */
  it('identifies selectable property types', () => {
    expect(isSelectableProperty(TaskPropertyType.SELECT)).toBe(true);
    expect(isSelectableProperty(TaskPropertyType.MULTI_SELECT)).toBe(true);
    expect(isSelectableProperty(TaskPropertyType.TEXT)).toBe(false);
    expect(isSelectableProperty(TaskPropertyType.NUMBER)).toBe(false);
    expect(isSelectableProperty(TaskPropertyType.DATE)).toBe(false);
  });
});
