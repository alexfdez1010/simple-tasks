'use server';

import { requireAuthenticated } from '@/lib/auth/session';
import { taskService } from '@/lib/tasks';
import type {
  CreateTaskInput,
  MoveTaskInput,
  ReorderTasksInput,
  UpdateTaskInput,
} from '@/lib/tasks/types';
import {
  executeBoardAction,
  type ActionResult,
} from '@/lib/validation/action-result';

/** Creates one task from a trusted authenticated UI request. */
export async function createTaskAction(
  input: CreateTaskInput,
): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await taskService.create(input);
  });
}

/** Updates editable fields for one authenticated task request. */
export async function updateTaskAction(
  input: UpdateTaskInput,
): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await taskService.update(input);
  });
}

/** Deletes one task and compacts its column. */
export async function deleteTaskAction(id: string): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await taskService.delete(id);
  });
}

/** Moves one task across or within columns atomically. */
export async function moveTaskAction(
  input: MoveTaskInput,
): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await taskService.move(input);
  });
}

/** Reorders every task in one non-terminal column atomically. */
export async function reorderTasksAction(
  input: ReorderTasksInput,
): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await taskService.reorder(input);
  });
}
