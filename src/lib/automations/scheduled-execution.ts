import type { Prisma, PrismaClient } from '@/generated/prisma';
import { runSerializable } from '@/lib/db/transaction';
import { deserializeTaskPropertyValues } from '@/lib/automations/serialization';
import {
  renderAutomationTemplate,
  getScheduledDueDate,
} from '@/lib/automations/template';
import { persistTaskPropertyValues } from '@/lib/properties/value-persistence';
import type { TaskPropertyValueInput } from '@/lib/properties/types';
import { conflict, notFound } from '@/lib/validation/errors';

/** Runs due task-creation rules atomically and skips rules already claimed. */
export async function runDueScheduledAutomations(
  client: PrismaClient,
  now = new Date(),
): Promise<number> {
  const dueRules = await client.automation.findMany({
    where: {
      triggerType: 'SCHEDULED',
      actionType: 'CREATE_TASK',
      scheduledAt: { lte: now },
      executedAt: null,
    },
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  let executed = 0;
  for (const rule of dueRules) {
    const didExecute = await executeOneScheduledAutomation(
      client,
      rule.id,
      now,
    );
    if (didExecute) executed += 1;
  }
  return executed;
}

/** Claims and executes one rule inside a serializable transaction. */
async function executeOneScheduledAutomation(
  client: PrismaClient,
  id: string,
  now: Date,
): Promise<boolean> {
  return runSerializable(client, async (transaction) => {
    const automation = await transaction.automation.findUnique({
      where: { id },
    });
    if (
      !automation ||
      automation.triggerType !== 'SCHEDULED' ||
      automation.actionType !== 'CREATE_TASK' ||
      !automation.scheduledAt ||
      automation.executedAt
    )
      return false;
    if (!automation.taskStatusId || !automation.taskTitleTemplate)
      throw conflict('The scheduled task template is incomplete.');
    const status = await transaction.status.findUnique({
      where: { id: automation.taskStatusId },
    });
    if (!status) throw notFound('The task status');
    const aggregate = await transaction.task.aggregate({
      where: { statusId: status.id },
      _max: { position: true },
    });
    const task = await transaction.task.create({
      data: {
        title: renderAutomationTemplate(
          automation.taskTitleTemplate,
          automation.scheduledAt,
        ),
        description: automation.taskDescriptionTemplate
          ? renderAutomationTemplate(
              automation.taskDescriptionTemplate,
              automation.scheduledAt,
            )
          : null,
        dueDate: getScheduledDueDate(
          automation.scheduledAt,
          automation.taskDueDateOffsetDays,
        ),
        statusId: status.id,
        position: (aggregate._max.position ?? -1) + 1,
        completedAt: status.isTerminal ? now : null,
      },
    });
    const propertyValues = readTemplatePropertyValues(
      automation.taskPropertyValues,
    );
    if (propertyValues.length) {
      await persistTaskPropertyValues(
        transaction,
        task.id,
        propertyValues,
        true,
      );
    }
    await transaction.automation.update({
      where: { id: automation.id },
      data: { executedAt: now },
    });
    return true;
  });
}

/** Reads the normalized property template persisted with a scheduled rule. */
function readTemplatePropertyValues(
  value: Prisma.JsonValue | null,
): TaskPropertyValueInput[] {
  return deserializeTaskPropertyValues(value);
}
