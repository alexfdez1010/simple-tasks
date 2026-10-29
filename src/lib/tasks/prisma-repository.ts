import type { PrismaClient, Task } from '@/generated/prisma';
import { reorderTaskRows } from '@/lib/tasks/task-reorder';
import { runSerializable } from '@/lib/db/transaction';
import { resequenceTasks, taskListOrder } from '@/lib/tasks/ordering';
import type { TaskRepository } from '@/lib/tasks/repository';
import { serializeTaskWithProperties } from '@/lib/tasks/serialization';
import { editTaskPlacement } from '@/lib/tasks/task-placement';
import {
  createAssignedTask,
  updateAssignedTask,
} from '@/lib/tasks/task-writes';
import {
  coordinatedTask,
  coordinatedTaskInclude,
} from '@/lib/coordination/read-model';
import { assertReviewTransition } from '@/lib/coordination/review-guards';
import { assertDependenciesSatisfied } from '@/lib/coordination/dependencies';
import type {
  BoardStatus,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTasksInput,
  TaskWithStatus,
  UpdateTaskInput,
} from '@/lib/tasks/types';
import { conflict, notFound } from '@/lib/validation/errors';

/** Prisma-backed task repository with transactional ordering invariants. */
export class PrismaTaskRepository implements TaskRepository {
  /** Injects the process-level Prisma client. */
  constructor(private readonly client: PrismaClient) {}

  /** Lists active tasks by due date and terminal tasks by completion date. */
  async listBoard(): Promise<BoardStatus[]> {
    const statuses = await this.client.status.findMany({
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    return Promise.all(
      statuses.map(async (status): Promise<BoardStatus> => {
        const rows = await this.client.task.findMany({
          where: { statusId: status.id },
          orderBy: taskListOrder(status.isTerminal),
          ...(status.isTerminal ? { take: 20 } : {}),
          include: { propertyValues: true },
        });
        const tasks = rows.map(serializeTaskWithProperties);
        return { ...status, tasks };
      }),
    );
  }

  /** Finds one task together with its current status. */
  async findById(id: string): Promise<TaskWithStatus | null> {
    const task = await this.client.task.findUnique({
      where: { id },
      include: coordinatedTaskInclude,
    });
    if (!task) return null;
    return coordinatedTask(task);
  }

  /** Creates an assigned task, preserving all ordering and dependency invariants. */
  create(input: CreateTaskInput): Promise<Task> {
    return createAssignedTask(this.client, input);
  }

  /** Edits ownership, relationships and fields in one transaction. */
  update(input: UpdateTaskInput): Promise<Task> {
    return updateAssignedTask(this.client, input);
  }

  /** Deletes a task atomically and compacts remaining positions. */
  async delete(id: string): Promise<void> {
    await runSerializable(this.client, async (transaction) => {
      const task = await transaction.task.findUnique({ where: { id } });
      if (!task) throw notFound('The task');
      if (
        await transaction.taskDependency.count({ where: { dependsOnId: id } })
      )
        throw conflict(
          'Remove references to this prerequisite before deleting it.',
        );

      await transaction.task.delete({ where: { id } });
      const remaining = await transaction.task.findMany({
        where: { statusId: task.statusId },
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      await resequenceTasks(
        transaction,
        remaining.map((item) => item.id),
      );
    });
  }

  /** Moves or reorders one task while maintaining contiguous source and target positions. */
  async move(input: MoveTaskInput): Promise<Task> {
    return runSerializable(this.client, async (transaction) => {
      const task = await transaction.task.findUnique({
        where: { id: input.id },
      });
      const target = await transaction.status.findUnique({
        where: { id: input.statusId },
      });
      if (!task) throw notFound('The task');
      if (!target) throw notFound('The status');
      await assertDependenciesSatisfied(transaction, task.id, target);
      await assertReviewTransition(transaction, task.id, target);
      const moved = await editTaskPlacement(
        transaction,
        task,
        target,
        input.index,
      );

      return moved;
    });
  }

  /** Reorders a complete non-terminal column after verifying exact membership. */
  async reorder(input: ReorderTasksInput): Promise<void> {
    await reorderTaskRows(this.client, input);
  }
}
