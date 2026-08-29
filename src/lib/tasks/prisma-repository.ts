import type { PrismaClient, Task } from '@/generated/prisma';
import { runSerializable } from '@/lib/db/transaction';
import { persistTaskPropertyValues } from '@/lib/properties/value-persistence';
import { resequenceTasks } from '@/lib/tasks/ordering';
import type { TaskRepository } from '@/lib/tasks/repository';
import { serializeTaskWithProperties } from '@/lib/tasks/serialization';
import {
  editAndRelocateTask,
  editTaskPlacement,
  type EditableTaskFields,
} from '@/lib/tasks/task-placement';
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

  /** Lists statuses and tasks in display order, limiting every terminal status to 20. */
  async listBoard(): Promise<BoardStatus[]> {
    const statuses = await this.client.status.findMany({
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    return Promise.all(
      statuses.map(async (status): Promise<BoardStatus> => {
        const rows = await this.client.task.findMany({
          where: { statusId: status.id },
          orderBy: status.isTerminal
            ? [
                { completedAt: { sort: 'desc', nulls: 'last' } },
                { updatedAt: 'desc' },
                { id: 'asc' },
              ]
            : [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
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
      include: { status: true, propertyValues: true },
    });
    if (!task) return null;
    return { ...serializeTaskWithProperties(task), status: task.status };
  }

  /** Creates a task at the end of an existing or default non-terminal column. */
  async create(input: CreateTaskInput): Promise<Task> {
    return runSerializable(this.client, async (transaction) => {
      let status = input.statusId
        ? await transaction.status.findUnique({ where: { id: input.statusId } })
        : await transaction.status.findFirst({
            where: { isTerminal: false },
            orderBy: { position: 'asc' },
          });
      status ??= input.statusId
        ? null
        : await transaction.status.findFirst({ orderBy: { position: 'asc' } });
      if (!status) throw notFound('El estado');
      const aggregate = await transaction.task.aggregate({
        where: { statusId: status.id },
        _max: { position: true },
      });
      const task = await transaction.task.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          dueDate: input.dueDate instanceof Date ? input.dueDate : null,
          statusId: status.id,
          position: (aggregate._max.position ?? -1) + 1,
          completedAt: status.isTerminal ? new Date() : null,
        },
      });
      if (input.propertyValues?.length) {
        await persistTaskPropertyValues(
          transaction,
          task.id,
          input.propertyValues,
          true,
        );
      }
      return task;
    });
  }

  /** Atomically updates editable fields and optionally relocates the task. */
  async update(input: UpdateTaskInput): Promise<Task> {
    return runSerializable(this.client, async (transaction) => {
      const task = await transaction.task.findUnique({
        where: { id: input.id },
      });
      if (!task) throw notFound('La tarea');
      const edits: EditableTaskFields = {
        title: input.title,
        description: input.description,
        dueDate:
          input.dueDate instanceof Date || input.dueDate === null
            ? input.dueDate
            : undefined,
      };
      const updated =
        input.statusId === undefined || input.index === undefined
          ? await transaction.task.update({
              where: { id: input.id },
              data: edits,
            })
          : await editAndRelocateTask(
              transaction,
              task,
              input.statusId,
              input.index,
              edits,
            );
      if (input.propertyValues !== undefined) {
        await persistTaskPropertyValues(
          transaction,
          task.id,
          input.propertyValues,
          true,
        );
      }
      return updated;
    });
  }

  /** Deletes a task atomically and compacts remaining positions. */
  async delete(id: string): Promise<void> {
    await runSerializable(this.client, async (transaction) => {
      const task = await transaction.task.findUnique({ where: { id } });
      if (!task) throw notFound('La tarea');
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
      if (!task) throw notFound('La tarea');
      if (!target) throw notFound('El estado');
      return editTaskPlacement(transaction, task, target, input.index);
    });
  }

  /** Reorders a complete non-terminal column after verifying exact membership. */
  async reorder(input: ReorderTasksInput): Promise<void> {
    await runSerializable(this.client, async (transaction) => {
      const status = await transaction.status.findUnique({
        where: { id: input.statusId },
      });
      if (!status) throw notFound('El estado');
      if (status.isTerminal)
        throw conflict('Los estados terminales se ordenan por finalización.');
      const rows = await transaction.task.findMany({
        where: { statusId: input.statusId },
        select: { id: true },
      });
      const expected = rows.map((item) => item.id).sort();
      const received = [...new Set(input.taskIds)].sort();
      if (
        expected.length !== received.length ||
        expected.some((id, index) => id !== received[index])
      ) {
        throw conflict(
          'El orden debe incluir exactamente todas las tareas del estado.',
        );
      }
      await resequenceTasks(transaction, input.taskIds);
    });
  }
}
