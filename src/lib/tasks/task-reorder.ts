import type { PrismaClient } from '@/generated/prisma';
import { runSerializable } from '@/lib/db/transaction';
import { resequenceTasks } from '@/lib/tasks/ordering';
import type { ReorderTasksInput } from '@/lib/tasks/types';
import { conflict, notFound } from '@/lib/validation/errors';
import { recordTaskEvent } from '@/lib/webhooks/outbox';

/** Verifies exact membership before reordering, recording only tasks whose stored position changes. */
export async function reorderTaskRows(
  client: PrismaClient,
  input: ReorderTasksInput,
): Promise<void> {
  await runSerializable(client, async (transaction) => {
    const status = await transaction.status.findUnique({
      where: { id: input.statusId },
    });
    if (!status) throw notFound('The status');
    if (status.isTerminal)
      throw conflict('Terminal statuses are ordered by completion date.');
    const rows = await transaction.task.findMany({
      where: { statusId: input.statusId },
      select: { id: true, position: true },
    });
    const expected = rows.map((item) => item.id).sort();
    const received = [...new Set(input.taskIds)].sort();
    if (
      expected.length !== received.length ||
      expected.some((id, index) => id !== received[index])
    )
      throw conflict(
        'The order must include every task in the status exactly once.',
      );
    await resequenceTasks(transaction, input.taskIds);
    const positions = new Map(rows.map((row) => [row.id, row.position]));
    for (const [position, id] of input.taskIds.entries())
      if (positions.get(id) !== position)
        await recordTaskEvent(transaction, 'task.updated', id);
  });
}
