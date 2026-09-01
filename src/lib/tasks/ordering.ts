import type { Prisma } from '@/generated/prisma';

/**
 * Returns the stable database ordering for an active or terminal task list.
 *
 * @param isTerminal - Whether completion time owns the list order.
 * @returns Prisma ordering clauses with null primary dates placed last.
 */
export function taskListOrder(
  isTerminal: boolean,
): Prisma.TaskOrderByWithRelationInput[] {
  return isTerminal
    ? [
        { completedAt: { sort: 'desc', nulls: 'last' } },
        { dueDate: { sort: 'desc', nulls: 'last' } },
        { updatedAt: 'desc' },
        { id: 'asc' },
      ]
    : [
        { dueDate: { sort: 'asc', nulls: 'last' } },
        { position: 'asc' },
        { createdAt: 'asc' },
        { id: 'asc' },
      ];
}

/** Clamps a requested insertion index to an array's valid inclusive boundary. */
export function clampTaskIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}

/** Rewrites task positions to a contiguous zero-based sequence. */
export async function resequenceTasks(
  transaction: Prisma.TransactionClient,
  taskIds: string[],
): Promise<void> {
  for (const [position, id] of taskIds.entries()) {
    await transaction.task.update({ where: { id }, data: { position } });
  }
}
