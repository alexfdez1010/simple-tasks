import type { PrismaClient } from '@/generated/prisma';
import { isAssignmentProperty } from '@/lib/coordination/assignment-property';
import { runSerializable } from '@/lib/db/transaction';
import { conflict, notFound } from '@/lib/validation/errors';

/**
 * Deletes the owner identified by id and its legacy SELECT options atomically.
 * Rejects missing/default owners and any task or review reference, including history.
 * Uses the injected client; returns no value and never deletes or reassigns tasks.
 */
export function deleteUnusedAssignee(
  client: PrismaClient,
  id: string,
): Promise<void> {
  return runSerializable(client, async (transaction) => {
    const assignee = await transaction.assignee.findUnique({ where: { id } });
    if (!assignee) throw notFound('The responsible party');
    if (id === 'assignee-default')
      throw conflict('The default responsible party cannot be deleted.');
    if (
      await transaction.task.findFirst({
        where: { OR: [{ assigneeId: id }, { reviewerId: id }] },
        select: { id: true },
      })
    )
      throw conflict(
        'Reassign all tasks and reviews before deleting this responsible party.',
      );

    const properties = await transaction.taskPropertyDefinition.findMany({
      where: { type: 'SELECT' },
    });
    for (const property of properties) {
      if (
        !isAssignmentProperty(property.name) ||
        !Array.isArray(property.options)
      )
        continue;
      if (!property.options.includes(assignee.name)) continue;
      const options = property.options.filter(
        (option) => option !== assignee.name,
      );
      if (!options.length) {
        const fallback = await transaction.assignee.findUniqueOrThrow({
          where: { id: 'assignee-default' },
        });
        options.push(fallback.name);
      }
      await transaction.taskPropertyDefinition.update({
        where: { id: property.id },
        data: { options },
      });
    }
    await transaction.assignee.delete({ where: { id } });
  });
}
