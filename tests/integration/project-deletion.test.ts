import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { coordinationService } from '@/lib/coordination';
import { reviewService } from '@/lib/coordination/reviews';
import { taskService } from '@/lib/tasks';
import { createApiToken } from '@/lib/api-tokens/store';
import { handleApiRequest } from '@/lib/api/handler';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const prefix = 'test:project-deletion:';
let source: string;
let destination: string;
let reviewer: string;

/** Removes only this suite's tasks/edges, projects, reviewer and API credentials from the isolated database. */
async function cleanup() {
  const ids = (
    await db.task.findMany({
      where: { title: { startsWith: prefix } },
      select: { id: true },
    })
  ).map(({ id }) => id);
  await db.taskDependency.deleteMany({
    where: { OR: [{ taskId: { in: ids } }, { dependsOnId: { in: ids } }] },
  });
  await db.task.deleteMany({ where: { id: { in: ids } } });
  await db.project.deleteMany({ where: { name: { startsWith: prefix } } });
  await db.assignee.deleteMany({ where: { name: { startsWith: prefix } } });
  const tokens = await db.apiToken.findMany({
    where: { name: { startsWith: prefix } },
  });
  await db.apiRateLimit.deleteMany({
    where: {
      key: { in: ['instance', ...tokens.map(({ id }) => `token:${id}`)] },
    },
  });
  await db.apiToken.deleteMany({ where: { name: { startsWith: prefix } } });
}

/** Dispatches a real REST deletion with an optional JSON transfer body. */
function remove(token: string, id: string, body?: unknown) {
  const path = `/projects/${id}`;
  return handleApiRequest(
    new Request(`http://localhost/api/v1${path}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    path,
  );
}

describe('persisted project deletion', () => {
  beforeEach(async () => {
    await cleanup();
    source = (
      await coordinationService.createProject({ name: prefix + 'source' })
    ).id;
    destination = (
      await coordinationService.createProject({ name: prefix + 'destination' })
    ).id;
    reviewer = (
      await coordinationService.createAssignee({
        name: prefix + 'reviewer',
        kind: 'AGENT',
      })
    ).id;
  });
  afterAll(async () => {
    await cleanup();
    await db.$disconnect();
  });

  /** Proves an empty project needs no invented destination and repeat deletion is a domain 404. */
  it('deletes empty projects and protects missing and default projects', async () => {
    await coordinationService.deleteProject({ id: source });
    expect(await db.project.findUnique({ where: { id: source } })).toBeNull();
    await expect(
      coordinationService.deleteProject({ id: source }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      coordinationService.deleteProject({
        id: 'project-general',
        destinationProjectId: destination,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  /** Proves occupied projects, including only completed history, cannot silently lose references. */
  it.each(['todo', 'done'])(
    'requires an existing distinct destination for tasks in %s',
    async (statusId) => {
      const task = await taskService.create({
        title: prefix + statusId,
        projectId: source,
        statusId,
      });
      await expect(
        coordinationService.deleteProject({ id: source }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
      await expect(
        coordinationService.deleteProject({
          id: source,
          destinationProjectId: 'missing',
        }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(() =>
        coordinationService.deleteProject({
          id: source,
          destinationProjectId: source,
        }),
      ).toThrow();
      expect(
        (await db.task.findUniqueOrThrow({ where: { id: task.id } })).projectId,
      ).toBe(source);
      expect(
        await db.project.findUnique({ where: { id: source } }),
      ).not.toBeNull();
    },
  );

  /** Proves transfer preserves complete history, dependency edges, content, dates, ownership and workflow placement. */
  it('transfers every task while preserving its data and dependency graph', async () => {
    const completed = await taskService.create({
      title: prefix + 'completed',
      projectId: source,
      statusId: 'done',
      description: '**Saved Markdown**',
      dueDate: new Date('2026-10-20T12:00:00Z'),
    });
    const active = await taskService.create({
      title: prefix + 'active',
      projectId: source,
      statusId: 'todo',
      dependencyIds: [completed.id],
      reviewerId: reviewer,
    });
    const before = await db.task.findMany({
      where: { id: { in: [completed.id, active.id] } },
      orderBy: { id: 'asc' },
    });
    const edges = await db.taskDependency.findMany({
      where: { taskId: active.id },
    });
    await coordinationService.deleteProject({
      id: source,
      destinationProjectId: destination,
    });
    const after = await db.task.findMany({
      where: { id: { in: [completed.id, active.id] } },
      orderBy: { id: 'asc' },
    });
    expect(after).toEqual(
      before.map((task) => ({
        ...task,
        projectId: destination,
        updatedAt: expect.any(Date),
      })),
    );
    expect(after.every(({ projectId }) => projectId === destination)).toBe(
      true,
    );
    expect(
      after.every((task, index) => task.updatedAt >= before[index].updatedAt),
    ).toBe(true);
    expect(
      await db.taskDependency.findMany({ where: { taskId: active.id } }),
    ).toEqual(edges);
    expect(await db.project.findUnique({ where: { id: source } })).toBeNull();
  });

  /** Proves concurrent assignment either joins the transfer or is rejected, never leaving an orphan task. */
  it('preserves references when new task creation races deletion', async () => {
    const [creation, deletion] = await Promise.allSettled([
      taskService.create({
        title: prefix + 'concurrent',
        projectId: source,
        statusId: 'todo',
      }),
      coordinationService.deleteProject({
        id: source,
        destinationProjectId: destination,
      }),
    ]);
    expect(deletion.status).toBe('fulfilled');
    expect(await db.project.findUnique({ where: { id: source } })).toBeNull();
    if (creation.status === 'fulfilled')
      expect(
        (await db.task.findUniqueOrThrow({ where: { id: creation.value.id } }))
          .projectId,
      ).toBe(destination);
    else
      expect(
        await db.task.count({ where: { title: prefix + 'concurrent' } }),
      ).toBe(0);
  });

  /** Proves bulk grouping cannot bypass the task editor's review-invalidation contract. */
  it.each(['PENDING', 'APPROVED'] as const)(
    'rejects transfers requiring invalidation of %s reviews',
    async (state) => {
      const task = await taskService.create({
        title: prefix + 'reviewed',
        projectId: source,
        statusId: 'todo',
        reviewerId: reviewer,
      });
      const submitted = await reviewService.submit({
        id: task.id,
        assigneeId: task.assigneeId,
      });
      if (state === 'APPROVED')
        await reviewService.decide({
          id: task.id,
          reviewerId: reviewer,
          expectedUpdatedAt: submitted.updatedAt.toISOString(),
          decision: 'APPROVE',
        });
      const before = await db.task.findUniqueOrThrow({
        where: { id: task.id },
      });
      await expect(
        coordinationService.deleteProject({
          id: source,
          destinationProjectId: destination,
        }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
      expect(
        await db.task.findUniqueOrThrow({ where: { id: task.id } }),
      ).toEqual(before);
      expect(
        await db.project.findUnique({ where: { id: source } }),
      ).not.toBeNull();
    },
  );

  /** Proves JSON DELETE shares authorization, validation, transfer and no-body empty-project behavior. */
  it('accepts optional REST transfer bodies without widening token permissions', async () => {
    const read = await createApiToken({
      name: prefix + 'read',
      canWrite: false,
    });
    const write = await createApiToken({
      name: prefix + 'write',
      canWrite: true,
    });
    const task = await taskService.create({
      title: prefix + 'rest',
      projectId: source,
      statusId: 'todo',
    });
    expect((await remove('invalid', source)).status).toBe(401);
    expect(
      (await remove(read.token, source, { destinationProjectId: destination }))
        .status,
    ).toBe(403);
    expect((await remove(write.token, source)).status).toBe(409);
    expect(
      (await remove(write.token, source, { destinationProjectId: source }))
        .status,
    ).toBe(422);
    expect(
      (
        await remove(write.token, source, {
          destinationProjectId: destination,
          unexpected: true,
        })
      ).status,
    ).toBe(422);
    expect(
      (await remove(write.token, source, { destinationProjectId: destination }))
        .status,
    ).toBe(204);
    expect(
      (await db.task.findUniqueOrThrow({ where: { id: task.id } })).projectId,
    ).toBe(destination);
    expect((await remove(write.token, source)).status).toBe(404);
    const empty = await coordinationService.createProject({
      name: prefix + 'empty',
    });
    expect((await remove(write.token, empty.id)).status).toBe(204);
  });
});
