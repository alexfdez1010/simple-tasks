import type { Status } from '@/generated/prisma';
import { db } from '@/lib/db/client';
import { PrismaAutomationRepository } from '@/lib/automations/prisma-repository';
import { PrismaTaskRepository } from '@/lib/tasks/prisma-repository';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const PREFIX = 'test:automation:';
const automationRepository = new PrismaAutomationRepository(db);
const taskRepository = new PrismaTaskRepository(db);

/** Removes only fixtures created by this integration suite. */
async function cleanFixtures(): Promise<void> {
  await db.automation.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.task.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await db.status.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

/** Creates a fixture status with an explicit stable ordering position. */
async function createStatus(
  name: string,
  position: number,
  isTerminal = false,
): Promise<Status> {
  return db.status.create({
    data: { color: '#287A50', isTerminal, name: `${PREFIX}${name}`, position },
  });
}

describe('automation transition execution', () => {
  /** Connects to the test database before this suite starts. */
  beforeAll(async () => db.$connect());

  /** Isolates every test from prior fixture data. */
  beforeEach(cleanFixtures);

  /** Disconnects after fixture cleanup. */
  afterAll(async () => {
    await cleanFixtures();
    await db.$disconnect();
  });

  /** Runs a completion action only when entering the target status. */
  it('applies matching actions atomically when a task changes status', async () => {
    const active = await createStatus('active', 100);
    const done = await createStatus('done', 101, true);
    await automationRepository.create({
      actionType: 'SET_COMPLETION_DATE_TODAY',
      name: `${PREFIX}completion`,
      triggerStatusId: done.id,
    });
    const task = await db.task.create({
      data: { position: 0, statusId: active.id, title: `${PREFIX}task` },
    });

    const moved = await taskRepository.move({
      id: task.id,
      index: 0,
      statusId: done.id,
    });
    expect(moved.completedAt).toBeInstanceOf(Date);
    await taskRepository.move({ id: task.id, index: 0, statusId: active.id });
    await expect(
      db.task.findUnique({ where: { id: task.id } }),
    ).resolves.toMatchObject({ completedAt: null });
  });
});
