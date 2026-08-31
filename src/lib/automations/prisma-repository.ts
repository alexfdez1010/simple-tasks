import { Prisma, type PrismaClient } from '@/generated/prisma';
import { runDueScheduledAutomations } from '@/lib/automations/scheduled-execution';
import { runSerializable } from '@/lib/db/transaction';
import { serializeAutomation } from '@/lib/automations/serialization';
import type { AutomationRepository } from '@/lib/automations/repository';
import type {
  AutomationDefinition,
  CreateAutomationInput,
  UpdateAutomationInput,
} from '@/lib/automations/types';
import { normalizeTaskPropertyValues } from '@/lib/properties/value-persistence';
import { notFound } from '@/lib/validation/errors';

/** Prisma implementation for the automation persistence boundary. */
export class PrismaAutomationRepository implements AutomationRepository {
  /** Injects the process-level Prisma client. */
  constructor(private readonly client: PrismaClient) {}

  /** Lists rules ordered by creation time. */
  async list(): Promise<AutomationDefinition[]> {
    const rows = await this.client.automation.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(serializeAutomation);
  }

  /** Creates a rule after checking its referenced status and property value. */
  create(input: CreateAutomationInput): Promise<AutomationDefinition> {
    return this.persist(input);
  }

  /** Updates a rule while applying the same domain checks as creation. */
  update(input: UpdateAutomationInput): Promise<AutomationDefinition> {
    return this.persist(input);
  }

  /** Deletes one rule and reports missing identifiers consistently. */
  async delete(id: string): Promise<void> {
    const result = await this.client.automation.deleteMany({ where: { id } });
    if (result.count === 0) throw notFound('The automation');
  }

  /** Executes due one-shot task-creation rules and returns the count created. */
  runDue(now?: Date): Promise<number> {
    return runDueScheduledAutomations(this.client, now);
  }

  /** Persists a normalized rule atomically. */
  private async persist(
    input: CreateAutomationInput | UpdateAutomationInput,
  ): Promise<AutomationDefinition> {
    return runSerializable(this.client, async (transaction) => {
      const triggerStatus = input.triggerStatusId
        ? await transaction.status.findUnique({
            where: { id: input.triggerStatusId },
          })
        : null;
      if (input.triggerType === 'STATUS_CHANGE' && !triggerStatus)
        throw notFound('The status');
      if ('id' in input && input.id) {
        const existing = await transaction.automation.findUnique({
          where: { id: input.id },
        });
        if (!existing) throw notFound('The automation');
      }
      const propertyValue = await this.normalizePropertyValue(
        transaction,
        input,
      );
      const taskStatus = input.taskStatusId
        ? await transaction.status.findUnique({
            where: { id: input.taskStatusId },
          })
        : null;
      if (input.actionType === 'CREATE_TASK' && !taskStatus)
        throw notFound('The task status');
      const taskPropertyValues = input.taskPropertyValues?.length
        ? await normalizeTaskPropertyValues(
            transaction,
            input.taskPropertyValues,
          )
        : null;
      const data = {
        name: input.name,
        triggerType: input.triggerType,
        triggerStatusId:
          input.triggerType === 'STATUS_CHANGE' ? input.triggerStatusId! : null,
        scheduledAt:
          input.triggerType === 'SCHEDULED' && input.scheduledAt
            ? new Date(input.scheduledAt)
            : null,
        executedAt: null,
        actionType: input.actionType,
        propertyId: input.propertyId ?? null,
        propertyValue: propertyValue === null ? Prisma.JsonNull : propertyValue,
        taskTitleTemplate: input.taskTitleTemplate ?? null,
        taskDescriptionTemplate: input.taskDescriptionTemplate ?? null,
        taskStatusId: input.taskStatusId ?? null,
        taskDueDateOffsetDays: input.taskDueDateOffsetDays ?? null,
        taskPropertyValues:
          taskPropertyValues === null ? Prisma.JsonNull : taskPropertyValues,
      };
      const row =
        'id' in input && input.id
          ? await transaction.automation.update({
              where: { id: input.id },
              data,
            })
          : await transaction.automation.create({ data });
      return serializeAutomation(row);
    });
  }

  /** Validates a property action against the current typed definition. */
  private async normalizePropertyValue(
    transaction: Prisma.TransactionClient,
    input: CreateAutomationInput | UpdateAutomationInput,
  ) {
    if (input.actionType !== 'SET_PROPERTY_VALUE') return null;
    if (!input.propertyId || input.propertyValue == null)
      throw new Error('Property actions require a property and a value.');
    const property = await transaction.taskPropertyDefinition.findUnique({
      where: { id: input.propertyId },
    });
    if (!property) throw notFound('The property');
    const [normalized] = await normalizeTaskPropertyValues(transaction, [
      { propertyId: property.id, value: input.propertyValue },
    ]);
    return normalized.value;
  }
}
