import { TaskPropertyType } from '@/generated/prisma';
import { db } from '@/lib/db/client';
import { PrismaPropertyRepository } from '@/lib/properties/prisma-repository';
import { PropertyService } from '@/lib/properties/service';
import type { PropertyValue } from '@/lib/properties/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const FIXTURE_PREFIX = 'test:properties:';
const repository = new PrismaPropertyRepository(db);
const service = new PropertyService(repository);

/** Resets properties in the dedicated test database and removes suite tasks. */
async function cleanFixtures(): Promise<void> {
  await db.taskPropertyValue.deleteMany();
  await db.task.deleteMany({
    where: { title: { startsWith: FIXTURE_PREFIX } },
  });
  await db.taskPropertyDefinition.deleteMany();
  await db.status.deleteMany({
    where: { name: { startsWith: FIXTURE_PREFIX } },
  });
}

/** Creates one task suitable for persisted property-value tests. */
async function createTask(suffix: string): Promise<{ id: string }> {
  const status = await db.status.create({
    data: {
      color: '#64748B',
      isTerminal: false,
      name: `${FIXTURE_PREFIX}status:${suffix}`,
      position: 500,
    },
  });
  return db.task.create({
    data: {
      position: 0,
      statusId: status.id,
      title: `${FIXTURE_PREFIX}task:${suffix}`,
    },
    select: { id: true },
  });
}

describe('PrismaPropertyRepository', () => {
  /** Opens the real PostgreSQL test database once. */
  beforeAll(async () => {
    await db.$connect();
  });

  /** Resets suite-owned records before every integration case. */
  beforeEach(async () => {
    await cleanFixtures();
  });

  /** Removes suite data and releases the Prisma connection. */
  afterAll(async () => {
    await cleanFixtures();
    await db.$disconnect();
  });

  /** Proves definitions support create, list, update, reorder, and delete. */
  it('executes complete definition CRUD with contiguous ordering', async () => {
    const text = await service.create({
      name: ` ${FIXTURE_PREFIX}text `,
      type: TaskPropertyType.TEXT,
    });
    const select = await service.create({
      name: `${FIXTURE_PREFIX}select`,
      options: [' High ', 'Low'],
      type: TaskPropertyType.SELECT,
    });
    const date = await service.create({
      name: `${FIXTURE_PREFIX}date`,
      type: TaskPropertyType.DATE,
    });

    expect(await service.list()).toEqual([
      expect.objectContaining({
        id: text.id,
        name: `${FIXTURE_PREFIX}text`,
        options: [],
        position: 0,
        type: TaskPropertyType.TEXT,
      }),
      expect.objectContaining({
        id: select.id,
        options: ['High', 'Low'],
        position: 1,
      }),
      expect.objectContaining({ id: date.id, position: 2 }),
    ]);

    await service.update({
      id: select.id,
      name: `${FIXTURE_PREFIX}priority`,
      options: ['High', 'Medium', 'Low'],
    });
    await service.reorder({ propertyIds: [date.id, text.id, select.id] });
    expect(
      (await service.list()).map(({ id, position }) => ({ id, position })),
    ).toEqual([
      { id: date.id, position: 0 },
      { id: text.id, position: 1 },
      { id: select.id, position: 2 },
    ]);

    await service.delete(text.id);
    expect(
      (await service.list()).map(({ id, position }) => ({ id, position })),
    ).toEqual([
      { id: date.id, position: 0 },
      { id: select.id, position: 1 },
    ]);
  });

  /** Proves serializable retries preserve unique contiguous positions under contention. */
  it('creates property definitions concurrently without position gaps', async () => {
    await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        service.create({
          name: `${FIXTURE_PREFIX}concurrent:${index}`,
          type: TaskPropertyType.TEXT,
        }),
      ),
    );

    const positions = (await service.list()).map(({ position }) => position);
    expect(positions).toEqual([0, 1, 2, 3, 4]);
    expect(new Set(positions).size).toBe(positions.length);
  });

  /** Proves the repository rejects a 101st definition before ordering can overflow. */
  it('enforces the maximum of one hundred property definitions', async () => {
    await db.taskPropertyDefinition.createMany({
      data: Array.from({ length: 100 }, (_, position) => ({
        name: `${FIXTURE_PREFIX}limit:${position}`,
        options: [],
        position,
        type: TaskPropertyType.TEXT,
      })),
    });

    await expect(
      service.create({
        name: `${FIXTURE_PREFIX}limit:overflow`,
        type: TaskPropertyType.TEXT,
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'The board supports at most 100 properties.',
    });
  });

  /** Proves all five property types persist and upsert normalized task values. */
  it('sets, updates, lists, and deletes task property values', async () => {
    const task = await createTask('values');
    const definitions = [];
    for (const input of [
      {
        name: `${FIXTURE_PREFIX}text`,
        type: TaskPropertyType.TEXT,
      },
      {
        name: `${FIXTURE_PREFIX}number`,
        type: TaskPropertyType.NUMBER,
      },
      {
        name: `${FIXTURE_PREFIX}date`,
        type: TaskPropertyType.DATE,
      },
      {
        name: `${FIXTURE_PREFIX}select`,
        options: ['High', 'Low'],
        type: TaskPropertyType.SELECT,
      },
      {
        name: `${FIXTURE_PREFIX}multi`,
        options: ['Frontend', 'Backend', 'Infra'],
        type: TaskPropertyType.MULTI_SELECT,
      },
    ]) {
      definitions.push(await service.create(input));
    }
    const values: PropertyValue[] = [
      'Exact text',
      12.5,
      '2026-09-05',
      'High',
      ['Infra', 'Frontend'],
    ];

    for (const [index, property] of definitions.entries()) {
      await service.setValue({
        propertyId: property.id,
        taskId: task.id,
        value: values[index]!,
      });
    }
    await service.setValue({
      propertyId: definitions[1]!.id,
      taskId: task.id,
      value: 20,
    });

    const persisted = await db.taskPropertyValue.findMany({
      orderBy: { property: { position: 'asc' } },
      select: { propertyId: true, value: true },
      where: { taskId: task.id },
    });
    expect(persisted).toEqual([
      { propertyId: definitions[0]!.id, value: 'Exact text' },
      { propertyId: definitions[1]!.id, value: 20 },
      { propertyId: definitions[2]!.id, value: '2026-09-05' },
      { propertyId: definitions[3]!.id, value: 'High' },
      {
        propertyId: definitions[4]!.id,
        value: ['Infra', 'Frontend'],
      },
    ]);

    await service.deleteValue(task.id, definitions[0]!.id);
    expect(
      await db.taskPropertyValue.count({
        where: { propertyId: definitions[0]!.id, taskId: task.id },
      }),
    ).toBe(0);
  });

  /** Proves invalid type and option changes cannot reinterpret stored values. */
  it('rejects incompatible definition updates with existing values', async () => {
    const task = await createTask('conflicts');
    const property = await service.create({
      name: `${FIXTURE_PREFIX}select`,
      options: ['High', 'Medium', 'Low'],
      type: TaskPropertyType.SELECT,
    });
    await service.setValue({
      propertyId: property.id,
      taskId: task.id,
      value: 'High',
    });

    await expect(
      service.update({
        id: property.id,
        options: ['Medium', 'Low'],
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'The new options would remove values that are in use.',
    });
    await expect(
      service.update({ id: property.id, type: TaskPropertyType.TEXT }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Delete existing values before changing the property type.',
    });
    await expect(
      service.setValue({
        propertyId: property.id,
        taskId: task.id,
        value: 'No configurada',
      }),
    ).rejects.toThrow();
  });

  /** Proves both relational owners cascade their task property values. */
  it('cascades values when deleting either a definition or task', async () => {
    const task = await createTask('cascade');
    const first = await service.create({
      name: `${FIXTURE_PREFIX}first`,
      type: TaskPropertyType.TEXT,
    });
    const second = await service.create({
      name: `${FIXTURE_PREFIX}second`,
      type: TaskPropertyType.TEXT,
    });
    for (const property of [first, second]) {
      await service.setValue({
        propertyId: property.id,
        taskId: task.id,
        value: property.name,
      });
    }

    await service.delete(first.id);
    expect(
      await db.taskPropertyValue.count({
        where: { propertyId: first.id, taskId: task.id },
      }),
    ).toBe(0);
    expect(
      await db.taskPropertyValue.count({
        where: { propertyId: second.id, taskId: task.id },
      }),
    ).toBe(1);

    await db.task.delete({ where: { id: task.id } });
    expect(
      await db.taskPropertyValue.count({
        where: { propertyId: second.id, taskId: task.id },
      }),
    ).toBe(0);
  });
});
