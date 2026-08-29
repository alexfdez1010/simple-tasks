import type { Status, Task } from '@/generated/prisma';

export type BoardStatus = Status & { tasks: Task[] };
export type TaskWithStatus = Task & { status: Status };

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  dueDate?: string | Date | null;
  statusId?: string;
};

export type UpdateTaskInput = {
  id: string;
  title?: string;
  description?: string | null;
  dueDate?: string | Date | null;
};

export type MoveTaskInput = { id: string; statusId: string; index: number };
export type ReorderTasksInput = { statusId: string; taskIds: string[] };
