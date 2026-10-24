import { randomUUID } from 'node:crypto';
import type { Prisma } from '@/generated/prisma';

export type TaskWebhookEvent =
  'task.created' | 'task.updated' | 'task.moved' | 'task.deleted';

/** Captures all task data and human-readable property/status names before a transaction commits. */
export async function webhookTaskSnapshot(
  transaction: Prisma.TransactionClient,
  id: string,
) {
  const task = await transaction.task.findUniqueOrThrow({
    where: { id },
    include: {
      status: { select: { id: true, name: true, isTerminal: true } },
      propertyValues: {
        include: { property: { select: { name: true, type: true } } },
      },
    },
  });
  return {
    ...task,
    propertyValues: task.propertyValues.map(
      ({ propertyId, value, property }) => ({ propertyId, ...property, value }),
    ),
  };
}

/** Atomically queues an enabled endpoint's event; rollback removes the event together with the task write. */
export async function recordTaskEvent(
  transaction: Prisma.TransactionClient,
  event: TaskWebhookEvent,
  taskId: string,
  previousStatusId: string | null = null,
  deletedSnapshot?: Awaited<ReturnType<typeof webhookTaskSnapshot>>,
) {
  const endpoint = await transaction.webhookEndpoint.findUnique({
    where: { id: 'default' },
  });
  if (!endpoint?.enabled) return;
  const id = randomUUID();
  const task =
    deletedSnapshot ?? (await webhookTaskSnapshot(transaction, taskId));
  const payload = JSON.parse(
    JSON.stringify({
      schemaVersion: 1,
      id,
      type: event,
      occurredAt: new Date().toISOString(),
      data: { task, previousStatusId },
    }),
  ) as Prisma.InputJsonObject;
  await transaction.webhookDelivery.create({
    data: { id, event, revision: endpoint.revision, payload },
  });
}
