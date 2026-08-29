'use client';

import type { Dispatch, SetStateAction } from 'react';

import {
  createStatusAction,
  deleteStatusAction,
  reorderStatusesAction,
  updateStatusAction,
} from '@/lib/statuses/actions';
import { cloneBoard } from '@/components/board/board-state';
import type {
  BoardStatus,
  MutationResult,
  StatusValues,
} from '@/components/board/types';

interface StatusMutationOptions {
  statuses: BoardStatus[];
  setStatuses: Dispatch<SetStateAction<BoardStatus[]>>;
  refresh: () => void;
}

/**
 * Provides optimistic workflow-state mutations with rollback.
 *
 * @param options - Current board, state setter, and server refresh callback.
 * @returns State create, update, delete, and reorder callbacks.
 */
export function useStatusMutations({
  statuses,
  setStatuses,
  refresh,
}: StatusMutationOptions) {
  /** Creates a temporary state and restores the board on failure. */
  async function create(values: StatusValues): Promise<MutationResult> {
    const snapshot = cloneBoard(statuses);
    const optimistic: BoardStatus = {
      id: `optimistic-${crypto.randomUUID()}`,
      ...values,
      position: snapshot.length,
      tasks: [],
    };
    setStatuses([...snapshot, optimistic]);
    const result = await createStatusAction(values);
    if (!result.success) setStatuses(snapshot);
    else refresh();
    return result;
  }

  /** Updates the visual and terminal properties of a state optimistically. */
  async function update(
    statusId: string,
    values: StatusValues,
  ): Promise<MutationResult> {
    const snapshot = cloneBoard(statuses);
    setStatuses(
      snapshot.map((status) =>
        status.id === statusId ? { ...status, ...values } : status,
      ),
    );
    const result = await updateStatusAction({ id: statusId, ...values });
    if (!result.success) setStatuses(snapshot);
    else refresh();
    return result;
  }

  /** Deletes an empty state optimistically. */
  async function remove(statusId: string): Promise<MutationResult> {
    const snapshot = cloneBoard(statuses);
    setStatuses(snapshot.filter((status) => status.id !== statusId));
    const result = await deleteStatusAction(statusId);
    if (!result.success) setStatuses(snapshot);
    else refresh();
    return result;
  }

  /** Moves a state one position and persists the complete order. */
  async function reorder(
    statusId: string,
    direction: -1 | 1,
  ): Promise<MutationResult> {
    const snapshot = cloneBoard(statuses);
    const from = snapshot.findIndex((status) => status.id === statusId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= snapshot.length) return { success: true };
    const next = [...snapshot];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const positioned = next.map((status, position) => ({
      ...status,
      position,
    }));
    setStatuses(positioned);
    const result = await reorderStatusesAction({
      statusIds: positioned.map((status) => status.id),
    });
    if (!result.success) setStatuses(snapshot);
    return result;
  }

  return { create, update, remove, reorder };
}
