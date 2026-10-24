'use client';

import { taskActionResult } from '@/components/board/task-action-result';
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
import {
  translate,
  type TranslationKey,
  type TranslationValues,
} from '@/lib/i18n/translations';

interface TaskMutationOptions {
  statuses: BoardStatus[];
  setStatuses: Dispatch<SetStateAction<BoardStatus[]>>;
  refresh: () => void;
  announce: (message: string) => void;
  /** Optional application translator; English is used for direct unit callers. */
  t?: (key: TranslationKey, values?: TranslationValues) => string;
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
  t,
}: TaskMutationOptions) {
  /** Translates an announcement using the injected app locale or English fallback. */
  const localize =
    t ??
    ((key: TranslationKey, values?: TranslationValues) =>
      translate('en', key, values));
  /** Creates a temporary task and rolls back when persistence fails. */
  async function create(values: TaskValues): Promise<MutationResult> {
    const snapshot = cloneBoard(statuses);
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    setStatuses(addTask(snapshot, values, optimisticId));
    const result = await taskActionResult(
      () =>
        createTaskAction({
          title: values.title,
          description: values.description || null,
          dueDate: values.dueDate || null,
          statusId: values.statusId,
          propertyValues: values.propertyValues,
        }),
      localize('task.retry'),
    );
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
    const result = await taskActionResult(
      () =>
        updateTaskAction({
          id: taskId,
          title: values.title,
          description: values.description || null,
          dueDate: values.dueDate || null,
          propertyValues: values.propertyValues,
          ...(statusChanged
            ? { statusId: values.statusId, index: target?.index ?? 0 }
            : {}),
        }),
      localize('task.saveFallback'),
    );
    if (!result.success) {
      setStatuses(snapshot);
      return result;
    }
    if (statusChanged)
      announce(
        localize('task.movedAnnouncement', {
          status: target?.status.name ?? values.statusId,
        }),
      );
    refresh();
    return result;
  }

  /** Moves without unmounting the inspector until persistence succeeds, retaining errors and selection. */
  async function moveTask(
    taskId: string,
    statusId: string,
  ): Promise<MutationResult> {
    const result = await taskActionResult(
      () => moveTaskAction({ id: taskId, statusId, index: 0 }),
      localize('task.saveFallback'),
    );
    if (result.success) {
      announce(
        localize('task.movedAnnouncement', {
          status:
            statuses.find((status) => status.id === statusId)?.name ?? statusId,
        }),
      );
      refresh();
    }
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
    if (before.status.id === after.status.id && after.status.isTerminal) {
      setStatuses(snapshot);
      announce(
        localize('task.terminalAnnouncement', { status: after.status.name }),
      );
      return;
    }
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
      announce(
        localize('task.movedAnnouncement', { status: after.status.name }),
      );
      refresh();
    }
  }

  return { create, update, moveTask, remove, persistDrag };
}
