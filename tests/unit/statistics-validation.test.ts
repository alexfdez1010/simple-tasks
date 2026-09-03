import {
  StatisticColor,
  StatisticDateBucket,
  StatisticDateField,
  StatisticDateRange,
  StatisticGroupBy,
  StatisticMeasure,
  StatisticSize,
  StatisticScope,
  StatisticVisualization,
  TaskPropertyType,
} from '@/generated/prisma';
import type { CreateStatisticInput } from '@/lib/statistics/types';
import { normalizeStatisticDefinition } from '@/lib/validation/statistics';
import { describe, expect, it } from 'vitest';

const properties = [
  {
    id: 'points',
    name: 'Points',
    options: [],
    position: 0,
    type: TaskPropertyType.NUMBER,
  },
  {
    id: 'release',
    name: 'Release',
    options: [],
    position: 1,
    type: TaskPropertyType.DATE,
  },
];
const statuses = [
  {
    color: '#64748B',
    id: 'todo',
    isTerminal: false,
    name: 'To do',
    position: 0,
  },
];

/** Creates one structurally complete statistic validation input. */
function input(
  overrides: Partial<CreateStatisticInput> = {},
): CreateStatisticInput {
  return {
    color: StatisticColor.FOREST,
    dateBucket: null,
    dateField: null,
    datePropertyId: null,
    dateRange: StatisticDateRange.ALL_TIME,
    groupBy: StatisticGroupBy.NONE,
    groupPropertyId: null,
    measure: StatisticMeasure.COUNT,
    measurePropertyId: null,
    name: 'Tasks',
    scope: StatisticScope.ALL,
    size: StatisticSize.AUTO,
    statusIds: [],
    visualization: StatisticVisualization.KPI,
    ...overrides,
  };
}

describe('normalizeStatisticDefinition', () => {
  /** Proves irrelevant relation fields are cleared before persistence. */
  it('normalizes a KPI to an ungrouped definition', () => {
    expect(
      normalizeStatisticDefinition(
        input({
          dateBucket: StatisticDateBucket.MONTH,
          dateField: StatisticDateField.PROPERTY,
          datePropertyId: 'release',
          groupBy: StatisticGroupBy.DATE,
        }),
        properties,
        statuses,
      ),
    ).toMatchObject({
      dateBucket: null,
      dateField: null,
      datePropertyId: null,
      groupBy: StatisticGroupBy.NONE,
    });
  });

  /** Proves arithmetic measures accept only existing NUMBER properties. */
  it('rejects a non-number measure property', () => {
    expect(() =>
      normalizeStatisticDefinition(
        input({ measure: StatisticMeasure.SUM, measurePropertyId: 'release' }),
        properties,
        statuses,
      ),
    ).toThrow(/number property/i);
  });

  /** Proves line charts require a configured date dimension. */
  it('rejects a line chart without a date dimension', () => {
    expect(() =>
      normalizeStatisticDefinition(
        input({
          groupBy: StatisticGroupBy.STATUS,
          visualization: StatisticVisualization.LINE,
        }),
        properties,
        statuses,
      ),
    ).toThrow(/date dimension/i);
  });

  /** Proves custom dates accept only DATE property definitions. */
  it('validates a custom date property', () => {
    expect(
      normalizeStatisticDefinition(
        input({
          dateBucket: StatisticDateBucket.MONTH,
          dateField: StatisticDateField.PROPERTY,
          datePropertyId: 'release',
          groupBy: StatisticGroupBy.DATE,
          visualization: StatisticVisualization.LINE,
        }),
        properties,
        statuses,
      ),
    ).toMatchObject({ datePropertyId: 'release' });
  });

  /** Proves relative periods retain their date source outside a timeline. */
  it('accepts a relative period on a KPI', () => {
    expect(
      normalizeStatisticDefinition(
        input({
          dateField: StatisticDateField.CREATED_AT,
          dateRange: StatisticDateRange.LAST_30_DAYS,
        }),
        properties,
        statuses,
      ),
    ).toMatchObject({
      dateField: StatisticDateField.CREATED_AT,
      dateRange: StatisticDateRange.LAST_30_DAYS,
    });
  });

  /** Proves every bounded period has an explicit date source. */
  it('rejects a relative period without a date field', () => {
    expect(() =>
      normalizeStatisticDefinition(
        input({ dateRange: StatisticDateRange.LAST_7_DAYS }),
        properties,
        statuses,
      ),
    ).toThrow(/date field/i);
  });

  /** Proves a state filter cannot silently reference an unknown workflow state. */
  it('rejects unknown status filters', () => {
    expect(() =>
      normalizeStatisticDefinition(
        input({ statusIds: ['missing'] }),
        properties,
        statuses,
      ),
    ).toThrow(/unknown status/i);
  });
});
