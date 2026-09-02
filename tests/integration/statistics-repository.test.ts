import { TaskPropertyType } from '@/generated/prisma';
import { db } from '@/lib/db/client';
import { PrismaStatisticsRepository } from '@/lib/statistics/prisma-repository';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const FIXTURE_PREFIX = 'test:statistics:';
const repository = new PrismaStatisticsRepository(db);

/** Removes only records owned by this integration suite. */
async function cleanFixtures(): Promise<void> {
  await db.taskPropertyDefinition.deleteMany({
    where: { name: { startsWith: FIXTURE_PREFIX } },
  });
  await db.task.deleteMany({
    where: { title: { startsWith: FIXTURE_PREFIX } },
  });
  await db.status.deleteMany({
    where: { name: { startsWith: FIXTURE_PREFIX } },
  });
}

describe('PrismaStatisticsRepository', () => {
  /** Opens the dedicated PostgreSQL test database once. */
  beforeAll(async () => {
    await db.$connect();
  });

  /** Starts every case without statistics-owned records. */
  beforeEach(async () => {
    await cleanFixtures();
  });

  /** Removes fixtures and releases the database connection. */
  afterAll(async () => {
    await cleanFixtures();
    await db.$disconnect();
  });

  /** Proves the source is uncapped and excludes non-selectable properties. */
  it('loads every completion with selectable property values', async () => {
    const status = await db.status.create({
      data: {
        color: '#22C55E',
        isTerminal: true,
        name: `${FIXTURE_PREFIX}done`,
        position: 900,
      },
    });
    const selectable = await db.taskPropertyDefinition.create({
      data: {
        name: `${FIXTURE_PREFIX}responsible`,
        options: ['Codex', 'Alejandro'],
        position: 900,
        type: TaskPropertyType.SELECT,
      },
    });
    await db.taskPropertyDefinition.create({
      data: {
        name: `${FIXTURE_PREFIX}notes`,
        position: 901,
        type: TaskPropertyType.TEXT,
      },
    });
    const origin = Date.parse('2040-01-01T00:00:00.000Z');
    const tasks = await Promise.all(
      Array.from({ length: 22 }, (_, index) =>
        db.task.create({
          data: {
            completedAt: new Date(origin + index * 60_000),
            createdAt: new Date(origin - 3_600_000),
            position: index,
            statusId: status.id,
            title: `${FIXTURE_PREFIX}${index}`,
          },
        }),
      ),
    );
    await db.taskPropertyValue.create({
      data: {
        propertyId: selectable.id,
        taskId: tasks[0]!.id,
        value: 'Codex',
      },
    });

    const source = await repository.loadSource();
    const fixtureTasks = source.completedTasks.filter(
      (task) => task.createdAt.getTime() === origin - 3_600_000,
    );
    const fixtureProperties = source.properties.filter((property) =>
      property.name.startsWith(FIXTURE_PREFIX),
    );

    expect(fixtureTasks).toHaveLength(22);
    expect(fixtureTasks[0]?.propertyValues).toEqual([
      { propertyId: selectable.id, value: 'Codex' },
    ]);
    expect(fixtureProperties).toEqual([
      expect.objectContaining({
        id: selectable.id,
        options: ['Codex', 'Alejandro'],
        type: TaskPropertyType.SELECT,
      }),
    ]);
  });
});
