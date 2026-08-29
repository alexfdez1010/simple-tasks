import type { Task } from '@/generated/prisma';
import type {
  BoardStatus,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTasksInput,
  TaskWithStatus,
  UpdateTaskInput,
} from '@/lib/tasks/types';

/** Focused persistence contract consumed by task business logic. */
export interface TaskRepository {
  /** Returns the ordered board projection. */
  listBoard(): Promise<BoardStatus[]>;
  /** Finds a task and its status by identifier. */
  findById(id: string): Promise<TaskWithStatus | null>;
  /** Persists a validated task at the end of a column. */
  create(input: CreateTaskInput): Promise<Task>;
  /** Persists validated editable task fields. */
  update(input: UpdateTaskInput): Promise<Task>;
  /** Removes a task while preserving column order. */
  delete(id: string): Promise<void>;
  /** Moves a task while preserving source and target order. */
  move(input: MoveTaskInput): Promise<Task>;
  /** Applies the exact order of one active column. */
  reorder(input: ReorderTasksInput): Promise<void>;
}
