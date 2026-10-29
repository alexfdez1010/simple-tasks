import { recordTaskEvent } from '@/lib/webhooks/outbox';
import type { PrismaClient } from '@/generated/prisma';
import { runSerializable } from '@/lib/db/transaction';
import { persistTaskPropertyValues } from '@/lib/properties/value-persistence';
import type {
  SetTaskPropertyValueInput,
  TaskPropertyValueData,
} from '@/lib/properties/types';
import { notFound } from '@/lib/validation/errors';

/** Saves one validated property and refreshes its task timestamp atomically. */
export function setTaskValue(
  client: PrismaClient,
  input: SetTaskPropertyValueInput,
): Promise<TaskPropertyValueData> {
  return runSerializable(client, async (transaction) => {
    const previous = await transaction.task.findUnique({
      where: { id: input.taskId },
    });
    if (!previous) throw notFound('The task');
    const [value] = await persistTaskPropertyValues(
      transaction,
      input.taskId,
      [input],
      false,
    );
    const updated = await transaction.task.update({
      where: { id: input.taskId },
      data: { updatedAt: new Date() },
    });

    await recordTaskEvent(
      transaction,
      updated.statusId === previous.statusId ? 'task.updated' : 'task.moved',
      input.taskId,
      updated.statusId === previous.statusId ? null : previous.statusId,
    );
    return value;
  });
}

/** Removes a task value and refreshes its task timestamp; missing values reject atomically. */
export async function deleteTaskValue(
  client: PrismaClient,
  taskId: string,
  propertyId: string,
): Promise<void> {
  await runSerializable(client, async (transaction) => {
    const previous = await transaction.task.findUnique({
      where: { id: taskId },
    });
    if (!previous) throw notFound('The task');
    const result = await transaction.taskPropertyValue.deleteMany({
      where: { taskId, propertyId },
    });
    if (!result.count) throw notFound('The property value');
    const updated = await transaction.task.update({
      where: { id: taskId },
      data: { updatedAt: new Date() },
    });
    await recordTaskEvent(
      transaction,
      updated.statusId === previous.statusId ? 'task.updated' : 'task.moved',
      taskId,
      updated.statusId === previous.statusId ? null : previous.statusId,
    );
  });
}
