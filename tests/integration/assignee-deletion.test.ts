import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { coordinationService } from '@/lib/coordination';
import { taskService } from '@/lib/tasks';
import { createApiToken } from '@/lib/api-tokens/store';
import { handleApiRequest } from '@/lib/api/handler';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const prefix = 'test:assignee-deletion:';
const propertyIds: string[] = [];
let ownerId: string;

/** Clears only this suite's records and legacy definitions from the isolated test database. */
async function cleanup() {
  await db.task.deleteMany({ where: { title: { startsWith: prefix } } });
  await db.assignee.deleteMany({ where: { name: { startsWith: prefix } } });
  await db.taskPropertyDefinition.deleteMany({
    where: { id: { in: propertyIds } },
  });
  propertyIds.length = 0;
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

/** Sends an authenticated DELETE through the real REST adapter with no request body. */
function remove(token: string, id: string) {
  const path = `/assignees/${id}`;
  return handleApiRequest(
    new Request(`http://localhost/api/v1${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
    path,
  );
}

describe('persisted responsible-party deletion', () => {
  beforeEach(async () => {
    await cleanup();
    ownerId = (
      await coordinationService.createAssignee({
        name: prefix + 'unused',
        kind: 'AGENT',
      })
    ).id;
  });
  afterAll(async () => {
    await cleanup();
    await db.$disconnect();
  });

  /** Proves deletion clears assignment choices while retaining unrelated properties and identities. */
  it('deletes unused owners and cleans only their legacy assignment SELECT choices', async () => {
    const owner = await db.assignee.findUniqueOrThrow({
      where: { id: ownerId },
    });
    for (const name of ['aSsIgNeE', 'rEsPoNsAbLe', prefix + 'unrelated']) {
      const property = await db.taskPropertyDefinition.create({
        data: {
          name,
          type: 'SELECT',
          position: 90,
          options: ['Alejandro', owner.name],
        },
      });
      propertyIds.push(property.id);
    }
    await coordinationService.deleteAssignee({ id: ownerId });
    expect(await db.assignee.findUnique({ where: { id: ownerId } })).toBeNull();
    for (const id of propertyIds.slice(0, 2)) {
      expect(
        (await db.taskPropertyDefinition.findUniqueOrThrow({ where: { id } }))
          .options,
      ).toEqual(['Alejandro']);
    }
    expect(
      (
        await db.taskPropertyDefinition.findUniqueOrThrow({
          where: { id: propertyIds[2] },
        })
      ).options,
    ).toEqual(['Alejandro', owner.name]);
    expect(
      await db.assignee.findUnique({ where: { id: 'assignee-default' } }),
    ).not.toBeNull();
    await expect(
      coordinationService.deleteAssignee({ id: ownerId }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  /** Proves legacy SELECT definitions remain valid when their only option is deleted. */
  it('keeps the default owner as a choice when removing the last legacy option', async () => {
    const owner = await db.assignee.findUniqueOrThrow({
      where: { id: ownerId },
    });
    const property = await db.taskPropertyDefinition.create({
      data: {
        name: 'aSsIgNeE',
        type: 'SELECT',
        position: 90,
        options: [owner.name],
      },
    });
    propertyIds.push(property.id);
    await coordinationService.deleteAssignee({ id: ownerId });
    expect(
      (
        await db.taskPropertyDefinition.findUniqueOrThrow({
          where: { id: property.id },
        })
      ).options,
    ).toEqual(['Alejandro']);
  });

  /** Proves active and completed task ownership both preserve assignments and legacy choices. */
  it.each(['todo', 'done'])(
    'rejects owners of tasks in %s',
    async (statusId) => {
      const task = await taskService.create({
        title: prefix + statusId,
        assigneeId: ownerId,
        statusId,
      });
      const before = await db.taskPropertyDefinition.findMany();
      await expect(
        coordinationService.deleteAssignee({ id: ownerId }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
      expect(
        (await db.task.findUniqueOrThrow({ where: { id: task.id } }))
          .assigneeId,
      ).toBe(ownerId);
      expect(await db.taskPropertyDefinition.findMany()).toEqual(before);
      expect(
        await db.assignee.findUnique({ where: { id: ownerId } }),
      ).not.toBeNull();
    },
  );

  /** Proves reviewer references and legacy default ownership cannot be silently removed. */
  it('rejects reviewers and the default responsible party', async () => {
    const task = await taskService.create({
      title: prefix + 'review',
      reviewerId: ownerId,
      statusId: 'todo',
    });
    await expect(
      coordinationService.deleteAssignee({ id: ownerId }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(
      (await db.task.findUniqueOrThrow({ where: { id: task.id } })).reviewerId,
    ).toBe(ownerId);
    await expect(
      coordinationService.deleteAssignee({ id: 'assignee-default' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  /** Proves concurrent assignment and deletion cannot leave a task with a missing owner. */
  it('preserves referential integrity when assignment races deletion', async () => {
    const results = await Promise.allSettled([
      taskService.create({
        title: prefix + 'race',
        assigneeId: ownerId,
        statusId: 'todo',
      }),
      coordinationService.deleteAssignee({ id: ownerId }),
    ]);
    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    );
    const rows = await db.task.findMany({ where: { assigneeId: ownerId } });
    expect(
      Boolean(await db.assignee.findUnique({ where: { id: ownerId } })),
    ).toBe(rows.length > 0);
  });

  /** Proves REST shares authorization, conflicts, success and missing-owner semantics. */
  it('exposes deletion through REST with write-only access and domain status codes', async () => {
    const read = await createApiToken({
      name: prefix + 'read',
      canWrite: false,
    });
    const write = await createApiToken({
      name: prefix + 'write',
      canWrite: true,
    });
    expect((await remove('invalid', ownerId)).status).toBe(401);
    expect((await remove(read.token, ownerId)).status).toBe(403);
    expect((await remove(write.token, 'assignee-default')).status).toBe(409);
    expect((await remove(write.token, ownerId)).status).toBe(204);
    expect((await remove(write.token, ownerId)).status).toBe(404);
  });
});
