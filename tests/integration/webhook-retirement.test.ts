import { afterAll, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { TaskService } from '@/lib/tasks/service';
import { PrismaTaskRepository } from '@/lib/tasks/prisma-repository';

const taskService = new TaskService(new PrismaTaskRepository(db));
const id = 'test:retired-webhook';

/** Preserves unrelated fixtures and always closes the isolated database connection. */
afterAll(async () => {
  await db.$executeRaw`DELETE FROM "WebhookDelivery" WHERE id = ${id}`;
  await db.$executeRaw`DELETE FROM "WebhookEndpoint" WHERE url = 'https://retired.example.com/tasks'`;
  await db.$disconnect();
});

describe('retired webhook compatibility', () => {
  /** Proves old configuration and pending data stay inert while task writes retain their behavior. */
  it('does not queue or send task changes even with an enabled legacy endpoint', async () => {
    await db.$executeRaw`INSERT INTO "WebhookEndpoint" (id, url, secret, enabled, "updatedAt") VALUES ('default', 'https://retired.example.com/tasks', 'retired-test-secret', true, NOW()) ON CONFLICT (id) DO NOTHING`;
    await db.$executeRaw`INSERT INTO "WebhookDelivery" (id, revision, event, payload) VALUES (${id}, 1, 'task.created', '{}'::jsonb)`;
    const before = await db.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT COUNT(*) AS count FROM "WebhookDelivery"`;
    const task = await taskService.create({ title: id, statusId: 'todo' });
    try {
      await taskService.update({ id: task.id, title: id + ':edited' });
      await taskService.move({
        id: task.id,
        statusId: 'in-progress',
        index: 0,
      });
      expect((await taskService.getById(task.id)).title).toBe(id + ':edited');
    } finally {
      await taskService.delete(task.id);
    }
    expect(
      await db.$queryRaw`SELECT COUNT(*) AS count FROM "WebhookDelivery"`,
    ).toEqual(before);
    expect(
      await db.$queryRaw`SELECT state, attempts FROM "WebhookDelivery" WHERE id = ${id}`,
    ).toEqual([{ state: 'PENDING', attempts: 0 }]);
  });
});
