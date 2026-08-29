import type { Prisma } from '@/generated/prisma';

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
