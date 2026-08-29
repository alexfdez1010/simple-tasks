'use client';

import type { Dispatch, SetStateAction } from 'react';

import {
  createTaskAction,
  deleteTaskAction,
  moveTaskAction,
  reorderTasksAction,
  updateTaskAction,
} from '@/lib/tasks/actions';
import {
  addTask,
  cloneBoard,
  editTask,
  findTask,
  removeTask,
  replaceTaskId,
} from '@/components/board/board-state';
import type {
  BoardStatus,
  MutationResult,
  TaskValues,
} from '@/components/board/types';

interface TaskMutationOptions {
  statuses: BoardStatus[];
  setStatuses: Dispatch<SetStateAction<BoardStatus[]>>;
  refresh: () => void;
  announce: (message: string) => void;
}

/**
 * Provides optimistic task mutations with rollback and server refresh.
 *
 * @param options - Current board, state setter, refresh, and live announcer.
 * @returns Task CRUD and drag persistence callbacks.
 */
export function useTaskMutations({
  statuses,
  setStatuses,
  refresh,
  announce,
}: TaskMutationOptions) {
  /** Creates a temporary task and rolls back when persistence fails. */
  async function create(values: TaskValues): Promise<MutationResult> {
    const snapshot = cloneBoard(statuses);
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    setStatuses(addTask(snapshot, values, optimisticId));
    const result = await createTaskAction({
      title: values.title,
      description: values.description || null,
      dueDate: values.dueDate || null,
      statusId: values.statusId,
      propertyValues: values.propertyValues,
    });
    if (!result.success) setStatuses(snapshot);
    else {
      const persistedId = result.data?.id;
      if (persistedId) {
        setStatuses((current) =>
          replaceTaskId(current, optimisticId, persistedId),
        );
      }
      refresh();
    }
    return result;
  }

  /** Updates task fields and state, reverting the full optimistic change on failure. */
  async function update(
    taskId: string,
    values: TaskValues,
  ): Promise<MutationResult> {
    const snapshot = cloneBoard(statuses);
    const previous = findTask(snapshot, taskId);
    const next = editTask(snapshot, taskId, values);
    const target = findTask(next, taskId);
    const statusChanged = previous?.status.id !== values.statusId;
    setStatuses(next);
    const result = await updateTaskAction({
      id: taskId,
      title: values.title,
      description: values.description || null,
      dueDate: values.dueDate || null,
      propertyValues: values.propertyValues,
      ...(statusChanged
        ? { statusId: values.statusId, index: target?.index ?? 0 }
        : {}),
    });
    if (!result.success) {
      setStatuses(snapshot);
      return result;
    }
    refresh();
    return result;
  }

  /** Deletes a task optimistically and restores it when persistence fails. */
  async function remove(taskId: string): Promise<MutationResult> {
    const snapshot = cloneBoard(statuses);
    setStatuses(removeTask(snapshot, taskId));
    const result = await deleteTaskAction(taskId);
    if (!result.success) setStatuses(snapshot);
    else refresh();
    return result;
  }

  /** Persists a completed drag as a move or an exact within-column order. */
  async function persistDrag(
    taskId: string,
    snapshot: BoardStatus[],
    finalBoard: BoardStatus[],
  ) {
    const before = findTask(snapshot, taskId);
    const after = findTask(finalBoard, taskId);
    if (!before || !after) return;
    if (before.status.id === after.status.id && after.status.isTerminal) return;
    const result =
      before.status.id === after.status.id
        ? await reorderTasksAction({
            statusId: after.status.id,
            taskIds: after.status.tasks.map((task) => task.id),
          })
        : await moveTaskAction({
            id: taskId,
            statusId: after.status.id,
            index: after.index,
          });
    if (!result.success) setStatuses(snapshot);
    else {
      announce(`Task moved to ${after.status.name}.`);
      refresh();
    }
  }

  return { create, update, remove, persistDrag };
}
