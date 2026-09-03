import {
  StatisticGroupBy,
  StatisticDateRange,
  StatisticMeasure,
  StatisticScope,
  StatisticVisualization,
  TaskPropertyType,
} from '@/generated/prisma';
import { db } from '@/lib/db/client';
import { PrismaStatisticsRepository } from '@/lib/statistics/prisma-repository';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const PREFIX = 'test:statistics:';
const repository = new PrismaStatisticsRepository(db);

/** Removes only records owned by this integration suite. */
async function cleanFixtures(): Promise<void> {
  await db.statisticWidget.deleteMany({
    where: { name: { startsWith: PREFIX } },
  });
  await db.taskPropertyDefinition.deleteMany({
    where: { name: { startsWith: PREFIX } },
  });
  await db.task.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await db.status.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

describe('PrismaStatisticsRepository', () => {
  /** Opens the dedicated PostgreSQL test database once. */
  beforeAll(async () => db.$connect());
  /** Starts every case without statistics-owned records. */
  beforeEach(cleanFixtures);
  /** Removes fixtures and releases the database connection. */
  afterAll(async () => {
    await cleanFixtures();
    await db.$disconnect();
  });

  /** Proves the source includes uncapped tasks, all property types, and widgets. */
  it('loads the complete configurable analytics source', async () => {
    const status = await db.status.create({
      data: {
        color: '#22C55E',
        isTerminal: true,
        name: `${PREFIX}done`,
        position: 900,
      },
    });
    const property = await db.taskPropertyDefinition.create({
      data: {
        name: `${PREFIX}points`,
        position: 900,
        type: TaskPropertyType.NUMBER,
      },
    });
    await db.taskPropertyDefinition.create({
      data: {
        name: `${PREFIX}notes`,
        position: 901,
        type: TaskPropertyType.TEXT,
      },
    });
    const tasks = await Promise.all(
      Array.from({ length: 22 }, (_, index) =>
        db.task.create({
          data: {
            completedAt: new Date(
              `2040-01-01T00:${String(index).padStart(2, '0')}:00.000Z`,
            ),
            position: index,
            statusId: status.id,
            title: `${PREFIX}${index}`,
          },
        }),
      ),
    );
    await db.taskPropertyValue.create({
      data: { propertyId: property.id, taskId: tasks[0]!.id, value: 8 },
    });
    const created = await repository.create({
      dateBucket: null,
      dateField: null,
      datePropertyId: null,
      dateRange: StatisticDateRange.ALL_TIME,
      groupBy: StatisticGroupBy.NONE,
      groupPropertyId: null,
      measure: StatisticMeasure.AVERAGE,
      measurePropertyId: property.id,
      name: `${PREFIX}velocity`,
      scope: StatisticScope.ALL,
      statusIds: [status.id],
      visualization: StatisticVisualization.KPI,
    });

    const source = await repository.loadSource();
    expect(
      source.tasks.filter((task) => task.statusId === status.id),
    ).toHaveLength(22);
    expect(
      source.properties.filter((item) => item.name.startsWith(PREFIX)),
    ).toHaveLength(2);
    expect(source.statistics).toContainEqual(
      expect.objectContaining({ id: created.id }),
    );
    expect(
      source.tasks.find((task) => task.id === tasks[0]!.id)?.propertyValues,
    ).toEqual([{ propertyId: property.id, value: 8 }]);
  });
});
