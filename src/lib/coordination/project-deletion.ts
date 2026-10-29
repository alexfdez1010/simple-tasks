import { Prisma, type PrismaClient } from '@/generated/prisma';
import type { DeleteProjectInput } from '@/lib/coordination/schemas';
import { runSerializable } from '@/lib/db/transaction';
import { conflict, notFound } from '@/lib/validation/errors';

/**
 * Removes one project, transferring every historical/active task to an explicit destination atomically.
 * Preserves task content, placement and relationships; rejects protected/default projects,
 * unavailable destinations and transfers that would invalidate pending or approved reviews.
 * The injected client owns persistence; no task or review is deleted and no value is returned.
 */
export async function deleteProjectAndMoveTasks(
  client: PrismaClient,
  { id, destinationProjectId }: DeleteProjectInput,
): Promise<void> {
  try {
    await runSerializable(client, async (transaction) => {
      if (!(await transaction.project.findUnique({ where: { id } })))
        throw notFound('The project');
      if (id === 'project-general')
        throw conflict('The default project cannot be deleted.');
      if ((await transaction.project.count()) <= 1)
        throw conflict('Keep at least one project.');
      if (destinationProjectId === id)
        throw conflict(
          'Choose a destination different from the project being deleted.',
        );
      if (
        destinationProjectId &&
        !(await transaction.project.findUnique({
          where: { id: destinationProjectId },
        }))
      )
        throw notFound('The destination project');
      const hasTasks = await transaction.task.findFirst({
        where: { projectId: id },
        select: { id: true },
      });
      if (hasTasks && !destinationProjectId)
        throw conflict(
          'Choose a destination project to preserve all tasks, including completed history.',
        );
      if (hasTasks) {
        const reviewed = await transaction.task.findFirst({
          where: {
            projectId: id,
            reviewState: { in: ['PENDING', 'APPROVED'] },
          },
          select: { id: true },
        });
        if (reviewed)
          throw conflict(
            'Move pending or approved review tasks through the task editor before deleting this project.',
          );
        await transaction.task.updateMany({
          where: { projectId: id },
          data: { projectId: destinationProjectId },
        });
      }
      await transaction.project.delete({ where: { id } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003' || error.code === 'P2034')
        throw conflict(
          'The project changed while deleting it. Refresh and retry.',
        );
      if (error.code === 'P2025') throw notFound('The project');
    }
    throw error;
  }
}
