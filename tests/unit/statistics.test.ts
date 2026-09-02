import { TaskPropertyType } from '@/generated/prisma';
import { buildStatisticsSnapshot } from '@/lib/statistics/aggregation';
import type { StatisticsRepository } from '@/lib/statistics/repository';
import { StatisticsService } from '@/lib/statistics/service';
import type {
  CompletedTaskRecord,
  SelectablePropertyRecord,
  StatisticsSource,
} from '@/lib/statistics/types';
import { describe, expect, it, vi } from 'vitest';

const RESPONSIBLE: SelectablePropertyRecord = {
  id: 'responsible',
  name: 'Responsible',
  options: ['Alejandro', 'Codex'],
  position: 0,
  type: TaskPropertyType.SELECT,
};

const AREAS: SelectablePropertyRecord = {
  id: 'areas',
  name: 'Areas',
  options: ['Frontend', 'Backend'],
  position: 1,
  type: TaskPropertyType.MULTI_SELECT,
};

/** Creates one deterministic completed-task analytics record. */
function completedTask(
  durationHours: number,
  propertyValues: CompletedTaskRecord['propertyValues'],
): CompletedTaskRecord {
  const createdAt = new Date('2026-09-01T08:00:00.000Z');
  return {
    completedAt: new Date(createdAt.getTime() + durationHours * 3_600_000),
    createdAt,
    propertyValues,
  };
}

describe('buildStatisticsSnapshot', () => {
  /** Proves mean duration and select assignment shares use every completion. */
  it('calculates resolution time and select distribution', () => {
    const snapshot = buildStatisticsSnapshot({
      completedTasks: [
        completedTask(2, [{ propertyId: RESPONSIBLE.id, value: 'Alejandro' }]),
        completedTask(4, []),
      ],
      properties: [RESPONSIBLE],
    });

    expect(snapshot).toEqual({
      averageResolutionTimeMs: 3 * 3_600_000,
      completedTaskCount: 2,
      properties: [
        {
          assignedTaskCount: 1,
          name: 'Responsible',
          propertyId: 'responsible',
          type: TaskPropertyType.SELECT,
          values: [
            { count: 1, label: 'Alejandro', percentage: 50 },
            { count: 0, label: 'Codex', percentage: 0 },
            { count: 1, label: null, percentage: 50 },
          ],
        },
      ],
    });
  });

  /** Proves multi-select work contributes once to every unique chosen option. */
  it('supports multi-select distributions without duplicate task values', () => {
    const snapshot = buildStatisticsSnapshot({
      completedTasks: [
        completedTask(1, [
          {
            propertyId: AREAS.id,
            value: ['Frontend', 'Backend', 'Frontend'],
          },
        ]),
        completedTask(1, [{ propertyId: AREAS.id, value: ['Backend'] }]),
      ],
      properties: [AREAS],
    });

    expect(snapshot.properties[0]).toMatchObject({
      assignedTaskCount: 2,
      values: [
        { count: 1, label: 'Frontend', percentage: 50 },
        { count: 2, label: 'Backend', percentage: 100 },
      ],
    });
  });

  /** Proves empty histories return a stable unavailable mean and zero options. */
  it('handles an empty completion history', () => {
    expect(
      buildStatisticsSnapshot({
        completedTasks: [],
        properties: [RESPONSIBLE],
      }),
    ).toEqual({
      averageResolutionTimeMs: null,
      completedTaskCount: 0,
      properties: [
        {
          assignedTaskCount: 0,
          name: 'Responsible',
          propertyId: 'responsible',
          type: TaskPropertyType.SELECT,
          values: [
            { count: 0, label: 'Alejandro', percentage: 0 },
            { count: 0, label: 'Codex', percentage: 0 },
          ],
        },
      ],
    });
  });

  /** Proves corrupt negative elapsed time cannot lower the reported mean. */
  it('clamps negative elapsed time to zero', () => {
    expect(
      buildStatisticsSnapshot({
        completedTasks: [completedTask(-2, [])],
        properties: [],
      }).averageResolutionTimeMs,
    ).toBe(0);
  });
});

describe('StatisticsService', () => {
  /** Proves the use case depends only on its focused repository abstraction. */
  it('loads and aggregates its injected source', async () => {
    const source: StatisticsSource = {
      completedTasks: [completedTask(2, [])],
      properties: [],
    };
    const repository: StatisticsRepository = {
      loadSource: vi.fn(async () => source),
    };
    const service = new StatisticsService(repository);

    await expect(service.getSnapshot()).resolves.toMatchObject({
      averageResolutionTimeMs: 7_200_000,
      completedTaskCount: 1,
    });
    expect(repository.loadSource).toHaveBeenCalledOnce();
  });
});
