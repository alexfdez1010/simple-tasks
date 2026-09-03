import {
  StatisticDateBucket,
  StatisticDateField,
  StatisticGroupBy,
  StatisticMeasure,
  StatisticScope,
  StatisticVisualization,
  TaskPropertyType,
} from '@/generated/prisma';
import { buildStatisticsSnapshot } from '@/lib/statistics/aggregation';
import type { StatisticsRepository } from '@/lib/statistics/repository';
import { StatisticsService } from '@/lib/statistics/service';
import type {
  StatisticDefinition,
  StatisticsSource,
} from '@/lib/statistics/types';
import { describe, expect, it, vi } from 'vitest';

const NOW = new Date('2026-09-03T12:00:00.000Z');
const STATUSES = [
  {
    color: '#64748B',
    id: 'todo',
    isTerminal: false,
    name: 'To do',
    position: 0,
  },
  { color: '#22C55E', id: 'done', isTerminal: true, name: 'Done', position: 1 },
];
const PROPERTIES = [
  {
    id: 'area',
    name: 'Area',
    options: ['Frontend', 'Backend'],
    position: 0,
    type: TaskPropertyType.MULTI_SELECT,
  },
  {
    id: 'points',
    name: 'Points',
    options: [],
    position: 1,
    type: TaskPropertyType.NUMBER,
  },
  {
    id: 'release',
    name: 'Release',
    options: [],
    position: 2,
    type: TaskPropertyType.DATE,
  },
];

/** Creates one complete statistic definition with focused overrides. */
function statistic(
  id: string,
  overrides: Partial<StatisticDefinition>,
): StatisticDefinition {
  return {
    dateBucket: null,
    dateField: null,
    datePropertyId: null,
    groupBy: StatisticGroupBy.NONE,
    groupPropertyId: null,
    id,
    measure: StatisticMeasure.COUNT,
    measurePropertyId: null,
    name: id,
    position: 0,
    scope: StatisticScope.ALL,
    statusIds: [],
    visualization: StatisticVisualization.KPI,
    ...overrides,
  };
}

/** Creates the deterministic task history shared by aggregation cases. */
function source(statistics: StatisticDefinition[]): StatisticsSource {
  return {
    properties: PROPERTIES,
    statistics,
    statuses: STATUSES,
    tasks: [
      {
        completedAt: new Date('2026-09-02T12:00:00.000Z'),
        createdAt: new Date('2026-09-01T12:00:00.000Z'),
        dueDate: new Date('2026-09-02T13:00:00.000Z'),
        id: 'one',
        propertyValues: [
          { propertyId: 'area', value: ['Frontend', 'Backend'] },
          { propertyId: 'points', value: 3 },
          { propertyId: 'release', value: '2026-09-02' },
        ],
        statusId: 'done',
        updatedAt: new Date('2026-09-02T12:00:00.000Z'),
      },
      {
        completedAt: null,
        createdAt: new Date('2026-09-03T08:00:00.000Z'),
        dueDate: new Date('2026-09-03T09:00:00.000Z'),
        id: 'two',
        propertyValues: [{ propertyId: 'points', value: 5 }],
        statusId: 'todo',
        updatedAt: new Date('2026-09-03T08:00:00.000Z'),
      },
    ],
  };
}

describe('buildStatisticsSnapshot', () => {
  /** Proves delivery, deadline, rate, and numeric KPI measures share one engine. */
  it('calculates the complete KPI measure catalog', () => {
    const definitions = [
      statistic('count', {}),
      statistic('completed', { measure: StatisticMeasure.COMPLETION_RATE }),
      statistic('overdue', { measure: StatisticMeasure.OVERDUE_COUNT }),
      statistic('resolution', {
        measure: StatisticMeasure.AVERAGE_RESOLUTION_TIME,
      }),
      statistic('on-time', { measure: StatisticMeasure.ON_TIME_RATE }),
      statistic('points', {
        measure: StatisticMeasure.AVERAGE,
        measurePropertyId: 'points',
      }),
    ];
    const snapshot = buildStatisticsSnapshot(source(definitions), NOW);
    const values = snapshot.statistics.map((item) =>
      item.result.kind === 'KPI' ? item.result.value : null,
    );

    expect(values).toEqual([2, 50, 1, 86_400_000, 100, 4]);
  });

  /** Proves custom multi-select dimensions preserve shares and unassigned work. */
  it('groups by any categorical custom property', () => {
    const definition = statistic('areas', {
      groupBy: StatisticGroupBy.PROPERTY,
      groupPropertyId: 'area',
      visualization: StatisticVisualization.BAR,
    });
    const result = buildStatisticsSnapshot(source([definition]), NOW)
      .statistics[0]!.result;

    expect(result).toMatchObject({
      kind: 'CHART',
      multiValue: true,
      values: [
        { label: 'Frontend', percentage: 50, taskCount: 1, value: 1 },
        { label: 'Backend', percentage: 50, taskCount: 1, value: 1 },
        { label: null, percentage: 50, taskCount: 1, value: 1 },
      ],
    });
  });

  /** Proves system and custom date fields generate chronological buckets. */
  it('groups timelines by a selected date source', () => {
    const completed = statistic('timeline', {
      dateBucket: StatisticDateBucket.DAY,
      dateField: StatisticDateField.COMPLETED_AT,
      groupBy: StatisticGroupBy.DATE,
      visualization: StatisticVisualization.LINE,
    });
    const custom = statistic('release', {
      dateBucket: StatisticDateBucket.MONTH,
      dateField: StatisticDateField.PROPERTY,
      datePropertyId: 'release',
      groupBy: StatisticGroupBy.DATE,
      visualization: StatisticVisualization.LINE,
    });
    const snapshot = buildStatisticsSnapshot(source([completed, custom]), NOW);

    expect(snapshot.statistics[0]?.result).toMatchObject({
      values: [{ label: '2026-09-02', value: 1 }],
    });
    expect(snapshot.statistics[1]?.result).toMatchObject({
      values: [{ label: '2026-09', value: 1 }],
    });
  });

  /** Proves scope and explicit status filters compose before grouping. */
  it('filters by task scope and workflow states', () => {
    const definition = statistic('filtered', {
      scope: StatisticScope.ACTIVE,
      statusIds: ['todo'],
    });
    const result = buildStatisticsSnapshot(source([definition]), NOW)
      .statistics[0]!.result;
    expect(result).toMatchObject({ kind: 'KPI', sampleSize: 1, value: 1 });
  });
});

describe('StatisticsService', () => {
  /** Proves UI and MCP use cases depend on one focused persistence abstraction. */
  it('loads and aggregates its injected source', async () => {
    const repository = {
      loadSource: vi.fn(async () => source([statistic('count', {})])),
    } as unknown as StatisticsRepository;
    const service = new StatisticsService(repository);

    await expect(service.getSnapshot(NOW)).resolves.toMatchObject({
      taskCount: 2,
    });
    expect(repository.loadSource).toHaveBeenCalledOnce();
  });
});
