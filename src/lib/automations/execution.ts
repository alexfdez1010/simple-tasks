import type { Prisma, Task } from '@/generated/prisma';
import type { PropertyValue } from '@/lib/properties/types';
import { persistTaskPropertyValues } from '@/lib/properties/value-persistence';

/** Applies every rule matching a newly entered status in the active transaction. */
export async function applyTransitionAutomations(
  transaction: Prisma.TransactionClient,
  task: Task,
  targetStatusId: string,
  now = new Date(),
): Promise<Task> {
  const automations = await transaction.automation.findMany({
    where: { triggerStatusId: targetStatusId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  let updated = task;
  for (const automation of automations) {
    if (automation.actionType === 'SET_COMPLETION_DATE_TODAY') {
      updated = await transaction.task.update({
        where: { id: task.id },
        data: { completedAt: now },
      });
      continue;
    }
    if (automation.propertyId && automation.propertyValue !== null) {
      await persistTaskPropertyValues(
        transaction,
        task.id,
        [
          {
            propertyId: automation.propertyId,
            value: automation.propertyValue as PropertyValue,
          },
        ],
        false,
      );
    }
  }
  return updated;
}
