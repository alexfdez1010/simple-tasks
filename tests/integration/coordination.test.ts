import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { PrismaCoordinationRepository } from '@/lib/coordination/repository';
import { TaskService } from '@/lib/tasks/service';
import { PrismaTaskRepository } from '@/lib/tasks/prisma-repository';
import { propertyService } from '@/lib/properties';

const prefix = 'test:coordination:';
const repository = new PrismaCoordinationRepository(db);
const tasks = new TaskService(new PrismaTaskRepository(db));
let owner: string;
let project: string;
let ready: string;
let working: string;
let done: string;

/** Removes only fixtures owned by this suite, clearing their dependency edges first. */
async function cleanup() {
  const rows = await db.task.findMany({
    where: { title: { startsWith: prefix } },
    select: { id: true },
  });
  await db.taskDependency.deleteMany({
    where: {
      OR: [
        { taskId: { in: rows.map((row) => row.id) } },
        { dependsOnId: { in: rows.map((row) => row.id) } },
      ],
    },
  });
  await db.task.deleteMany({ where: { title: { startsWith: prefix } } });
  await db.project.deleteMany({ where: { name: { startsWith: prefix } } });
  await db.assignee.deleteMany({ where: { name: { startsWith: prefix } } });
  await db.status.deleteMany({ where: { name: { startsWith: prefix } } });
}

/** Creates one task in the suite's isolated project and workflow. */
function create(title: string, dependencyIds: string[] = []) {
  return tasks.create({
    title: prefix + title,
    assigneeId: owner,
    projectId: project,
    statusId: ready,
    dependencyIds,
  });
}

describe('persisted task coordination', () => {
  beforeAll(async () => {
    await db.$connect();
  });
  beforeEach(async () => {
    await cleanup();
    owner = (
      await repository.createAssignee({
        name: prefix + 'agent',
        kind: 'AGENT',
        description: 'Follow the acceptance criteria.',
        color: '#7297CA',
      })
    ).id;
    project = (
      await repository.createProject({
        name: prefix + 'project',
        description: 'Project context',
      })
    ).id;
    ready = (
      await db.status.create({
        data: {
          name: prefix + 'ready',
          color: '#64748B',
          position: 100,
          workType: 'READY',
        },
      })
    ).id;
    working = (
      await db.status.create({
        data: {
          name: prefix + 'working',
          color: '#64748B',
          position: 101,
          workType: 'WORKING',
        },
      })
    ).id;
    done = (
      await db.status.create({
        data: {
          name: prefix + 'done',
          color: '#64748B',
          position: 102,
          isTerminal: true,
        },
      })
    ).id;
  });
  afterAll(async () => {
    await cleanup();
    await db.$disconnect();
  });

  it('stores dynamic owners, projects, descriptions and colors and enforces owner references', async () => {
    const task = await create('owned');
    expect(task).toMatchObject({ assigneeId: owner, projectId: project });
    await expect(
      repository.updateAssignee({
        id: owner,
        name: prefix + 'renamed',
        color: '#C3986A',
      }),
    ).resolves.toMatchObject({ id: owner, color: '#C3986A' });
    expect(
      (await db.task.findUniqueOrThrow({ where: { id: task.id } })).assigneeId,
    ).toBe(owner);
    await expect(
      tasks.update({ id: task.id, assigneeId: 'missing' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      db.task.update({
        where: { id: task.id },
        data: { assigneeId: null as unknown as string },
      }),
    ).rejects.toThrow();
  });
  it('rejects self-reference, missing prerequisites, duplicate dependencies and transitive cycles atomically', async () => {
    const a = await create('a');
    const b = await create('b', [a.id]);
    const c = await create('c', [b.id]);
    await expect(
      tasks.update({ id: a.id, dependencyIds: [a.id] }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      tasks.update({
        id: a.id,
        dependencyIds: [c.id],
        title: prefix + 'must-not-save',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      tasks.update({ id: a.id, dependencyIds: ['missing'] }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(
      (await db.task.findUniqueOrThrow({ where: { id: a.id } })).title,
    ).toBe(prefix + 'a');
    expect(() =>
      tasks.update({ id: a.id, dependencyIds: [b.id, b.id] }),
    ).toThrow();
  });
  it('serializes concurrent inverse dependencies so at most one can commit', async () => {
    const a = await create('a');
    const b = await create('b');
    const results = await Promise.allSettled([
      tasks.update({ id: a.id, dependencyIds: [b.id] }),
      tasks.update({ id: b.id, dependencyIds: [a.id] }),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      await db.taskDependency.count({
        where: { taskId: { in: [a.id, b.id] } },
      }),
    ).toBe(1);
  });
  it('derives readiness from all prerequisites and rejects premature movement', async () => {
    const a = await create('a');
    const b = await create('b', [a.id]);
    expect(
      (await repository.ready({ assigneeId: owner, limit: 20 })).map(
        (task) => task.id,
      ),
    ).toEqual([a.id]);
    await expect(
      tasks.move({ id: b.id, statusId: working, index: 0 }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      tasks.move({ id: b.id, statusId: done, index: 0 }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await tasks.move({ id: a.id, statusId: done, index: 0 });
    expect(
      (await repository.ready({ assigneeId: owner, limit: 20 })).map(
        (task) => task.id,
      ),
    ).toEqual([b.id]);
    await tasks.move({ id: a.id, statusId: ready, index: 0 });
    expect(
      (await repository.ready({ assigneeId: owner, limit: 20 })).map(
        (task) => task.id,
      ),
    ).toEqual([a.id]);
  });
  it('starts available work once under contention and returns complete owner/project context', async () => {
    const a = await create('a');
    const results = await Promise.allSettled([
      repository.start(a.id, owner),
      repository.start(a.id, owner),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      await repository.ready({ assigneeId: owner, limit: 20 }),
    ).toHaveLength(0);
    const result = results.find((value) => value.status === 'fulfilled');
    if (result?.status === 'fulfilled')
      expect(result.value).toMatchObject({
        assignee: { id: owner },
        project: { id: project },
      });
  });
  it('checks ownership, manual blocking and the current graph when starting', async () => {
    const a = await create('a');
    const b = await create('b', [a.id]);
    await expect(repository.start(a.id, 'someone-else')).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    await expect(repository.start(b.id, owner)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    await db.status.update({
      where: { id: ready },
      data: { workType: 'BLOCKED' },
    });
    expect(
      await repository.ready({ assigneeId: owner, limit: 20 }),
    ).toHaveLength(0);
    await expect(repository.start(a.id, owner)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
  it('protects edits based on an older task version and refuses deleting a referenced prerequisite', async () => {
    const a = await create('a');
    await create('b', [a.id]);
    await tasks.update({ id: a.id, title: prefix + 'new title' });
    await expect(
      tasks.update({
        id: a.id,
        title: prefix + 'stale',
        expectedUpdatedAt: a.updatedAt.toISOString(),
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(tasks.delete(a.id)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
  it('includes old completed prerequisite ancestors beyond the 20-completion preview', async () => {
    const old = await create('old');
    await tasks.move({ id: old.id, statusId: done, index: 0 });
    await db.task.update({
      where: { id: old.id },
      data: { completedAt: new Date('2020-01-01') },
    });
    await create('dependent', [old.id]);
    for (let index = 0; index < 22; index++) {
      const row = await create('completed-' + index);
      await tasks.move({ id: row.id, statusId: done, index: 0 });
    }
    const snapshot = await repository.snapshot();
    expect(snapshot.tasks.some((task) => task.id === old.id)).toBe(true);
    expect(
      snapshot.tasks.find((task) => task.title === prefix + 'dependent')?.ready,
    ).toBe(true);
  });
  it('accepts legacy assignment writes and mirrors canonical changes without losing custom values', async () => {
    let definition = await db.taskPropertyDefinition.findFirst({
      where: { name: 'Responsable' },
    });
    const ownsDefinition = !definition;
    definition ??= await db.taskPropertyDefinition.create({
      data: {
        name: 'Responsable',
        type: 'SELECT',
        options: [prefix + 'agent'],
        position: 100,
      },
    });
    if (
      !Array.isArray(definition.options) ||
      !definition.options.includes(prefix + 'agent')
    )
      await db.taskPropertyDefinition.update({
        where: { id: definition.id },
        data: {
          options: [
            ...(Array.isArray(definition.options) ? definition.options : []),
            prefix + 'agent',
          ],
        },
      });
    const a = await tasks.create({
      title: prefix + 'legacy',
      statusId: ready,
      propertyValues: [{ propertyId: definition.id, value: prefix + 'agent' }],
    });
    expect(a.assigneeId).toBe(owner);
    await repository.updateAssignee({ id: owner, name: prefix + 'renamed' });
    const stored = await db.taskPropertyValue.findUniqueOrThrow({
      where: { taskId_propertyId: { taskId: a.id, propertyId: definition.id } },
    });
    expect(stored.value).toBe(prefix + 'renamed');
    await propertyService
      .setValue({ taskId: a.id, propertyId: definition.id, value: 'Alejandro' })
      .catch(async () => {
        await db.taskPropertyDefinition.update({
          where: { id: definition.id },
          data: {
            options: [prefix + 'agent', prefix + 'renamed', 'Alejandro'],
          },
        });
        await propertyService.setValue({
          taskId: a.id,
          propertyId: definition.id,
          value: 'Alejandro',
        });
      });
    expect(
      (await db.task.findUniqueOrThrow({ where: { id: a.id } })).assigneeId,
    ).toBe('assignee-default');
    if (ownsDefinition)
      await db.taskPropertyDefinition.delete({ where: { id: definition.id } });
  });
});
