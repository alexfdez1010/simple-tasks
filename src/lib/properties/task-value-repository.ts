import type { PrismaClient } from '@/generated/prisma';
import { runSerializable } from '@/lib/db/transaction';
import { persistTaskPropertyValues } from '@/lib/properties/value-persistence';
import type {
  SetTaskPropertyValueInput,
  TaskPropertyValueData,
} from '@/lib/properties/types';
import { notFound } from '@/lib/validation/errors';
import { recordTaskEvent } from '@/lib/webhooks/outbox';

/** Saves one validated property and its task.updated event in the same transaction. */
export function setTaskValue(
  client: PrismaClient,
  input: SetTaskPropertyValueInput,
): Promise<TaskPropertyValueData> {
  return runSerializable(client, async (transaction) => {
    if (!(await transaction.task.findUnique({ where: { id: input.taskId } })))
      throw notFound('The task');
    const [value] = await persistTaskPropertyValues(
      transaction,
      input.taskId,
      [input],
      false,
    );
    await transaction.task.update({
      where: { id: input.taskId },
      data: { updatedAt: new Date() },
    });
    await recordTaskEvent(transaction, 'task.updated', input.taskId);
    return value;
  });
}

/** Removes a task value atomically; missing values reject without queuing any notification. */
export async function deleteTaskValue(
  client: PrismaClient,
  taskId: string,
  propertyId: string,
): Promise<void> {
  await runSerializable(client, async (transaction) => {
    const result = await transaction.taskPropertyValue.deleteMany({
      where: { taskId, propertyId },
    });
    if (!result.count) throw notFound('The property value');
    await transaction.task.update({
      where: { id: taskId },
      data: { updatedAt: new Date() },
    });
    await recordTaskEvent(transaction, 'task.updated', taskId);
  });
}
