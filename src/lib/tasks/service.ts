import type { Task } from '@/generated/prisma';
import type { TaskRepository } from '@/lib/tasks/repository';
import type {
  BoardStatus,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTasksInput,
  TaskWithStatus,
  UpdateTaskInput,
} from '@/lib/tasks/types';
import { idSchema, parseNullableDate } from '@/lib/validation/common';
import { notFound } from '@/lib/validation/errors';
import {
  createTaskSchema,
  moveTaskSchema,
  reorderTasksSchema,
  updateTaskSchema,
} from '@/lib/validation/tasks';

/** Task use cases shared by UI actions and the MCP transport. */
export class TaskService {
  /** Injects the persistence abstraction used by every task operation. */
  constructor(private readonly repository: TaskRepository) {}

  /** Returns the ordered board with terminal columns capped by the repository. */
  listBoard(): Promise<BoardStatus[]> {
    return this.repository.listBoard();
  }

  /** Returns one task or a domain-level missing-resource error. */
  async getById(id: string): Promise<TaskWithStatus> {
    const task = await this.repository.findById(idSchema.parse(id));
    if (!task) throw notFound('The task');
    return task;
  }

  /** Validates and creates one task in the requested or default status. */
  create(input: CreateTaskInput): Promise<Task> {
    const parsed = createTaskSchema.parse(input);
    return this.repository.create({
      ...parsed,
      dueDate: parseNullableDate(parsed.dueDate),
    });
  }

  /** Validates and updates editable task fields. */
  update(input: UpdateTaskInput): Promise<Task> {
    const parsed = updateTaskSchema.parse(input);
    return this.repository.update({
      ...parsed,
      dueDate:
        parsed.dueDate === undefined
          ? undefined
          : parseNullableDate(parsed.dueDate),
    });
  }

  /** Deletes a task and compacts its source column. */
  delete(id: string): Promise<void> {
    return this.repository.delete(idSchema.parse(id));
  }

  /** Moves a task atomically and synchronizes terminal completion metadata. */
  move(input: MoveTaskInput): Promise<Task> {
    return this.repository.move(moveTaskSchema.parse(input));
  }

  /** Applies a complete, exact order to a non-terminal column. */
  reorder(input: ReorderTasksInput): Promise<void> {
    return this.repository.reorder(reorderTasksSchema.parse(input));
  }
}
