import { db } from '@/lib/db/client';
import { PrismaStatusRepository } from '@/lib/statuses/prisma-repository';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const FIXTURE_PREFIX = 'test:statuses:';
const repository = new PrismaStatusRepository(db);

/** Deletes only records owned by this status repository suite. */
async function cleanFixtures(): Promise<void> {
  await db.task.deleteMany({
    where: { status: { name: { startsWith: FIXTURE_PREFIX } } },
  });
  await db.status.deleteMany({
    where: { name: { startsWith: FIXTURE_PREFIX } },
  });
}

describe('PrismaStatusRepository', () => {
  /** Opens the real test database once for this suite. */
  beforeAll(async () => {
    await db.$connect();
  });

  /** Resets suite-owned records before every repository case. */
  beforeEach(async () => {
    await cleanFixtures();
  });

  /** Removes fixture records and releases the Prisma connection. */
  afterAll(async () => {
    await cleanFixtures();
    await db.$disconnect();
  });

  /** Proves terminal toggles atomically add and clear task completion metadata. */
  it('synchronizes completedAt when terminal behavior changes', async () => {
    const status = await db.status.create({
      data: {
        color: '#2667FF',
        isTerminal: false,
        name: `${FIXTURE_PREFIX}toggle`,
        position: 100,
      },
    });
    const task = await db.task.create({
      data: { position: 0, statusId: status.id, title: 'toggle task' },
    });

    await repository.update({ id: status.id, isTerminal: true });
    expect(
      (await db.task.findUniqueOrThrow({ where: { id: task.id } })).completedAt,
    ).toBeInstanceOf(Date);

    await repository.update({ id: status.id, isTerminal: false });
    expect(
      (await db.task.findUniqueOrThrow({ where: { id: task.id } })).completedAt,
    ).toBeNull();
  });

  /** Proves a status with tasks cannot be deleted accidentally. */
  it('rejects deletion while a status still owns tasks', async () => {
    await db.status.create({
      data: {
        color: '#64748B',
        isTerminal: false,
        name: `${FIXTURE_PREFIX}fallback`,
        position: 99,
      },
    });
    const status = await db.status.create({
      data: {
        color: '#2667FF',
        isTerminal: false,
        name: `${FIXTURE_PREFIX}non-empty`,
        position: 100,
      },
    });
    await db.task.create({
      data: { position: 0, statusId: status.id, title: 'protected task' },
    });

    await expect(repository.delete(status.id)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Move or delete the tasks before deleting the status.',
    });
  });
});
