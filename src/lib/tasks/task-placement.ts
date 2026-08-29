import type { Prisma, Status, Task } from '@/generated/prisma';
import { clampTaskIndex, resequenceTasks } from '@/lib/tasks/ordering';
import { notFound } from '@/lib/validation/errors';

export type EditableTaskFields = {
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
};

/** Relocates and edits a task inside an existing database transaction. */
export async function editTaskPlacement(
  transaction: Prisma.TransactionClient,
  task: Task,
  target: Status,
  index: number,
  edits: EditableTaskFields = {},
): Promise<Task> {
  const sourceRows = await transaction.task.findMany({
    where: { statusId: task.statusId, id: { not: task.id } },
    orderBy: { position: 'asc' },
    select: { id: true },
  });
  const sourceIds = sourceRows.map((item) => item.id);
  const targetIds =
    task.statusId === target.id
      ? sourceIds
      : (
          await transaction.task.findMany({
            where: { statusId: target.id },
            orderBy: { position: 'asc' },
            select: { id: true },
          })
        ).map((item) => item.id);
  targetIds.splice(clampTaskIndex(index, targetIds.length), 0, task.id);

  const updated = await transaction.task.update({
    where: { id: task.id },
    data: {
      ...edits,
      statusId: target.id,
      completedAt: target.isTerminal ? (task.completedAt ?? new Date()) : null,
    },
  });
  if (task.statusId !== target.id)
    await resequenceTasks(transaction, sourceIds);
  await resequenceTasks(transaction, targetIds);
  return updated;
}

/** Resolves a target status and applies an atomic edit plus relocation. */
export async function editAndRelocateTask(
  transaction: Prisma.TransactionClient,
  task: Task,
  statusId: string,
  index: number,
  edits: EditableTaskFields,
): Promise<Task> {
  const target = await transaction.status.findUnique({
    where: { id: statusId },
  });
  if (!target) throw notFound('The status');
  return editTaskPlacement(transaction, task, target, index, edits);
}
