import type { Prisma, PrismaClient, Status } from '@/generated/prisma';
import { runSerializable } from '@/lib/db/transaction';
import type { StatusRepository } from '@/lib/statuses/repository';
import type {
  CreateStatusInput,
  ReorderStatusesInput,
  UpdateStatusInput,
} from '@/lib/statuses/types';
import { conflict, notFound } from '@/lib/validation/errors';

/** Rewrites status positions to a contiguous zero-based sequence. */
async function resequence(
  transaction: Prisma.TransactionClient,
  statusIds: string[],
): Promise<void> {
  for (const [position, id] of statusIds.entries()) {
    await transaction.status.update({ where: { id }, data: { position } });
  }
}

/** Prisma-backed status repository with atomic task metadata synchronization. */
export class PrismaStatusRepository implements StatusRepository {
  /** Injects the process-level Prisma client. */
  constructor(private readonly client: PrismaClient) {}

  /** Lists statuses in their configured board order. */
  list(): Promise<Status[]> {
    return this.client.status.findMany({ orderBy: { position: 'asc' } });
  }

  /** Appends a status after the current last column. */
  async create(input: CreateStatusInput): Promise<Status> {
    return runSerializable(this.client, async (transaction) => {
      const aggregate = await transaction.status.aggregate({
        _max: { position: true },
      });
      return transaction.status.create({
        data: { ...input, position: (aggregate._max.position ?? -1) + 1 },
      });
    });
  }

  /** Updates a status and synchronizes completedAt when terminal behavior changes. */
  async update(input: UpdateStatusInput): Promise<Status> {
    return runSerializable(this.client, async (transaction) => {
      const current = await transaction.status.findUnique({
        where: { id: input.id },
      });
      if (!current) throw notFound('The status');
      const status = await transaction.status.update({
        where: { id: input.id },
        data: {
          name: input.name,
          color: input.color,
          isTerminal: input.isTerminal,
        },
      });
      if (input.isTerminal === true && !current.isTerminal) {
        await transaction.task.updateMany({
          where: { statusId: input.id, completedAt: null },
          data: { completedAt: new Date() },
        });
      }
      if (input.isTerminal === false && current.isTerminal) {
        await transaction.task.updateMany({
          where: { statusId: input.id },
          data: { completedAt: null },
        });
      }
      return status;
    });
  }

  /** Deletes an empty status and compacts remaining status positions. */
  async delete(id: string): Promise<void> {
    await runSerializable(this.client, async (transaction) => {
      const status = await transaction.status.findUnique({ where: { id } });
      const statusCount = await transaction.status.count();
      const taskCount = await transaction.task.count({
        where: { statusId: id },
      });
      if (!status) throw notFound('The status');
      if (statusCount <= 1)
        throw conflict('The board must keep at least one status.');
      if (taskCount > 0)
        throw conflict('Move or delete the tasks before deleting the status.');
      await transaction.status.delete({ where: { id } });
      const remaining = await transaction.status.findMany({
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      await resequence(
        transaction,
        remaining.map((item) => item.id),
      );
    });
  }

  /** Applies an exact complete ordering after verifying membership and uniqueness. */
  async reorder(input: ReorderStatusesInput): Promise<void> {
    await runSerializable(this.client, async (transaction) => {
      const rows = await transaction.status.findMany({ select: { id: true } });
      const expected = rows.map((item) => item.id).sort();
      const received = [...new Set(input.statusIds)].sort();
      if (
        expected.length !== received.length ||
        expected.some((id, index) => id !== received[index])
      ) {
        throw conflict('The order must include every status exactly once.');
      }
      await resequence(transaction, input.statusIds);
    });
  }
}
