import type { Prisma } from '@/generated/prisma';
import { applyTransitionAutomations } from '@/lib/automations/execution';
import { describe, expect, it, vi } from 'vitest';

const TASK = {
  id: 'task-1',
  completedAt: null,
  statusId: 'todo',
} as never;

/** Builds the smallest transaction-shaped fake needed by the executor. */
function createTransaction() {
  return {
    automation: {
      findMany: vi.fn(async () => [
        {
          actionType: 'SET_PROPERTY_VALUE',
          propertyId: 'priority',
          propertyValue: 'High',
        },
      ]),
    },
    taskPropertyDefinition: {
      findMany: vi.fn(async () => [
        { id: 'priority', type: 'TEXT', options: [] },
      ]),
    },
    taskPropertyValue: { upsert: vi.fn(async () => undefined) },
    task: { update: vi.fn(async () => TASK) },
  } as unknown as Prisma.TransactionClient;
}

describe('applyTransitionAutomations', () => {
  /** Persists typed property values when a matching transition is executed. */
  it('applies a property action through the shared value persistence path', async () => {
    const transaction = createTransaction();

    await applyTransitionAutomations(transaction, TASK, 'done');

    expect(transaction.taskPropertyValue.upsert).toHaveBeenCalledWith({
      where: {
        taskId_propertyId: { taskId: 'task-1', propertyId: 'priority' },
      },
      create: { taskId: 'task-1', propertyId: 'priority', value: 'High' },
      update: { value: 'High' },
    });
  });
});
