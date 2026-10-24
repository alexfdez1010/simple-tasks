'use client';

import { useRef, useState } from 'react';
import type { BoardStatus } from '@/components/board/types';

/**
 * Keeps the mobile column selector in sync with native horizontal scrolling.
 * @param statuses - Ordered configured states, including empty and terminal columns.
 * @returns Board ref, selected state and capture/navigation actions; no persistence.
 */
export function useBoardNavigation(statuses: BoardStatus[]) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState(statuses[0]?.id ?? '');
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const activeId = statuses.some((status) => status.id === selectedId)
    ? selectedId
    : (statuses[0]?.id ?? '');

  /** Scrolls only the board horizontally, preserving the page's vertical position. */
  function selectColumn(id: string) {
    setSelectedId(id);
    const board = boardRef.current;
    const column = board?.querySelector<HTMLElement>(
      `[data-status-id="${CSS.escape(id)}"]`,
    );
    if (!board || !column) return;
    const padding = parseFloat(getComputedStyle(board).paddingInlineStart);
    board.scrollTo({
      left:
        board.scrollLeft +
        column.getBoundingClientRect().left -
        board.getBoundingClientRect().left -
        padding,
      behavior: 'instant',
    });
  }

  /** Selects the column closest to the board's leading edge after native scrolling. */
  function syncColumn() {
    const board = boardRef.current;
    if (!board) return;
    const leading =
      board.getBoundingClientRect().left +
      parseFloat(getComputedStyle(board).paddingInlineStart);
    const columns = Array.from(
      board.querySelectorAll<HTMLElement>('[data-status-id]'),
    );
    const closest = columns.reduce<HTMLElement | null>(
      (best, column) =>
        !best ||
        Math.abs(column.getBoundingClientRect().left - leading) <
          Math.abs(best.getBoundingClientRect().left - leading)
          ? column
          : best,
      null,
    );
    if (closest?.dataset.statusId) setSelectedId(closest.dataset.statusId);
  }

  /** Starts capture in the selected column and makes it horizontally visible. */
  function startCreate(id = activeId) {
    selectColumn(id);
    setCreatingId(id);
  }

  return {
    boardRef,
    activeId,
    creatingId,
    selectColumn,
    syncColumn,
    startCreate,
    stopCreate: () => setCreatingId(null),
  };
}
