import type { Status, Task } from '@/generated/prisma';
import { db } from '@/lib/db/client';
import { PrismaTaskRepository } from '@/lib/tasks/prisma-repository';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const FIXTURE_PREFIX = 'test:repository:';
const repository = new PrismaTaskRepository(db);

/** Deletes only records owned by this integration suite. */
async function cleanFixtures(): Promise<void> {
  await db.task.deleteMany({
    where: { status: { name: { startsWith: FIXTURE_PREFIX } } },
  });
  await db.status.deleteMany({
    where: { name: { startsWith: FIXTURE_PREFIX } },
  });
}

/** Creates one isolated workflow status. */
async function createStatus(
  suffix: string,
  position: number,
  isTerminal = false,
): Promise<Status> {
  return db.status.create({
    data: {
      color: isTerminal ? '#287A50' : '#2667FF',
      isTerminal,
      name: `${FIXTURE_PREFIX}${suffix}`,
      position,
    },
  });
}

/** Creates one task with explicit ordering and completion metadata. */
async function createTask(
  statusId: string,
  title: string,
  position: number,
  completedAt: Date | null = null,
  dueDate: Date | null = null,
): Promise<Task> {
  return db.task.create({
    data: { completedAt, dueDate, position, statusId, title },
  });
}

describe('PrismaTaskRepository', () => {
  /** Opens the real test database once for this suite. */
  beforeAll(async () => {
    await db.$connect();
  });

  /** Resets suite-owned records so every test starts deterministically. */
  beforeEach(async () => {
    await cleanFixtures();
  });

  /** Removes suite data and releases the database connection. */
  afterAll(async () => {
    await cleanFixtures();
    await db.$disconnect();
  });

  /** Proves active ordering and the per-terminal-column completion limit. */
  it('orders active tasks by due date and returns the 20 latest completions', async () => {
    const active = await createStatus('active', 100);
    const terminal = await createStatus('terminal', 101, true);
    await createTask(
      active.id,
      'active-last',
      0,
      null,
      new Date('2026-09-10T00:00:00.000Z'),
    );
    await createTask(
      active.id,
      'active-first',
      2,
      null,
      new Date('2026-09-01T00:00:00.000Z'),
    );

    const completedOrigin = Date.parse('2026-08-01T12:00:00.000Z');
    for (let index = 0; index < 22; index += 1) {
      await createTask(
        terminal.id,
        `terminal-${index.toString().padStart(2, '0')}`,
        index,
        new Date(completedOrigin + index * 60_000),
      );
    }

    const fixtureBoard = (await repository.listBoard()).filter((status) =>
      status.name.startsWith(FIXTURE_PREFIX),
    );

    expect(fixtureBoard.map((status) => status.id)).toEqual([
      active.id,
      terminal.id,
    ]);
    expect(fixtureBoard[0]?.tasks.map((task) => task.title)).toEqual([
      'active-first',
      'active-last',
    ]);
    expect(fixtureBoard[1]?.tasks).toHaveLength(20);
    expect(fixtureBoard[1]?.tasks.map((task) => task.title)).toEqual(
      Array.from(
        { length: 20 },
        (_, index) => `terminal-${(21 - index).toString().padStart(2, '0')}`,
      ),
    );
  });

  /** Proves completion timestamps take precedence over terminal due dates. */
  it('orders terminal tasks by descending completion date', async () => {
    const terminal = await createStatus('dated-terminal', 100, true);
    await createTask(
      terminal.id,
      'latest-deadline',
      0,
      new Date('2026-08-01T12:00:00.000Z'),
      new Date('2026-09-20T00:00:00.000Z'),
    );
    await createTask(
      terminal.id,
      'earlier-deadline',
      1,
      new Date('2026-08-03T12:00:00.000Z'),
      new Date('2026-09-10T00:00:00.000Z'),
    );
    await createTask(
      terminal.id,
      'undated',
      2,
      new Date('2026-08-04T12:00:00.000Z'),
    );
    await createTask(
      terminal.id,
      'missing-completion',
      3,
      null,
      new Date('2026-09-30T00:00:00.000Z'),
    );

    const [fixtureStatus] = (await repository.listBoard()).filter((status) =>
      status.name.startsWith(FIXTURE_PREFIX),
    );

    expect(fixtureStatus?.tasks.map((task) => task.title)).toEqual([
      'undated',
      'earlier-deadline',
      'latest-deadline',
      'missing-completion',
    ]);
  });

  /** Proves cross-column moves compact positions and synchronize completedAt. */
  it('moves into and out of a terminal status atomically', async () => {
    const active = await createStatus('active', 100);
    const terminal = await createStatus('terminal', 101, true);
    const first = await createTask(active.id, 'first', 0);
    const moving = await createTask(active.id, 'moving', 1);
    const last = await createTask(active.id, 'last', 2);
    const existing = await createTask(
      terminal.id,
      'existing',
      0,
      new Date('2026-08-01T12:00:00.000Z'),
    );

    const completed = await repository.move({
      id: moving.id,
      index: 0,
      statusId: terminal.id,
    });
    expect(completed.completedAt).toBeInstanceOf(Date);
    expect(
      await db.task.findMany({
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
        where: { statusId: active.id },
      }),
    ).toEqual([
      { id: first.id, position: 0 },
      { id: last.id, position: 1 },
    ]);
    expect(
      await db.task.findMany({
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
        where: { statusId: terminal.id },
      }),
    ).toEqual([
      { id: moving.id, position: 0 },
      { id: existing.id, position: 1 },
    ]);

    const reopened = await repository.move({
      id: moving.id,
      index: 1,
      statusId: active.id,
    });
    expect(reopened.completedAt).toBeNull();
    expect(
      await db.task.findMany({
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
        where: { statusId: active.id },
      }),
    ).toEqual([
      { id: first.id, position: 0 },
      { id: moving.id, position: 1 },
      { id: last.id, position: 2 },
    ]);
  });

  /** Proves an edit and relocation commit together or leave the task untouched. */
  it('atomically edits fields while changing status', async () => {
    const active = await createStatus('edit-active', 100);
    const terminal = await createStatus('edit-terminal', 101, true);
    const task = await createTask(active.id, 'original', 0);

    const updated = await repository.update({
      description: '**done**',
      id: task.id,
      index: 0,
      statusId: terminal.id,
      title: 'updated',
    });
    expect(updated).toMatchObject({
      description: '**done**',
      statusId: terminal.id,
      title: 'updated',
    });
    expect(updated.completedAt).toBeInstanceOf(Date);

    await expect(
      repository.update({
        id: task.id,
        index: 0,
        statusId: 'missing-status',
        title: 'must-not-persist',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      db.task.findUniqueOrThrow({ where: { id: task.id } }),
    ).resolves.toMatchObject({
      description: '**done**',
      statusId: terminal.id,
      title: 'updated',
    });
  });

  /** Proves reordering requires exact membership and excludes terminal columns. */
  it('enforces complete non-terminal reorder commands', async () => {
    const active = await createStatus('active', 100);
    const terminal = await createStatus('terminal', 101, true);
    const first = await createTask(active.id, 'first', 0);
    const second = await createTask(active.id, 'second', 1);
    const third = await createTask(active.id, 'third', 2);

    await repository.reorder({
      statusId: active.id,
      taskIds: [third.id, first.id, second.id],
    });
    expect(
      await db.task.findMany({
        orderBy: { position: 'asc' },
        select: { id: true },
        where: { statusId: active.id },
      }),
    ).toEqual([{ id: third.id }, { id: first.id }, { id: second.id }]);

    await expect(
      repository.reorder({
        statusId: active.id,
        taskIds: [first.id, first.id, third.id],
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      repository.reorder({ statusId: terminal.id, taskIds: [] }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Terminal statuses are ordered by completion date.',
    });
  });
});
