'use client';

import { move } from '@dnd-kit/helpers';
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/react';
import type { Dispatch, SetStateAction } from 'react';
import { useRef } from 'react';

import { cloneBoard } from '@/components/board/board-state';
import { KanbanColumn } from '@/components/board/kanban-column';
import type {
  BoardStatus,
  MutationResult,
  PropertyDefinition,
  TaskValues,
} from '@/components/board/types';

interface KanbanBoardProps {
  statuses: BoardStatus[];
  properties: PropertyDefinition[];
  setStatuses: Dispatch<SetStateAction<BoardStatus[]>>;
  onUpdate: (taskId: string, values: TaskValues) => Promise<MutationResult>;
  onDelete: (taskId: string) => Promise<MutationResult>;
  onPersistDrag: (
    taskId: string,
    snapshot: BoardStatus[],
    finalBoard: BoardStatus[],
  ) => Promise<void>;
}

/** Maps the board to the grouped record accepted by dnd-kit's move helper. */
function groupTasks(statuses: BoardStatus[]) {
  return Object.fromEntries(
    statuses.map((status) => [status.id, status.tasks]),
  );
}

/** Restores state ids and positions after the generic move helper runs. */
function applyGroupedTasks(
  statuses: BoardStatus[],
  grouped: Record<string, BoardStatus['tasks']>,
): BoardStatus[] {
  return statuses.map((status) => ({
    ...status,
    tasks: (grouped[status.id] ?? []).map((task, position) => ({
      ...task,
      statusId: status.id,
      position,
    })),
  }));
}

/**
 * Coordinates pointer, touch, and keyboard task dragging across columns.
 *
 * @param props - Board state and task mutation callbacks.
 * @returns A responsive drag-and-drop Kanban board.
 */
export function KanbanBoard({
  statuses,
  properties,
  setStatuses,
  onUpdate,
  onDelete,
  onPersistDrag,
}: KanbanBoardProps) {
  const snapshotRef = useRef<BoardStatus[]>(statuses);
  const latestRef = useRef<BoardStatus[]>(statuses);

  /** Captures an immutable board snapshot for cancellation and rollback. */
  function handleDragStart() {
    snapshotRef.current = cloneBoard(statuses);
    latestRef.current = statuses;
  }

  /** Applies dnd-kit's grouped move helper for immediate visual feedback. */
  function handleDragOver(event: DragOverEvent) {
    setStatuses((current) => {
      const grouped = move(groupTasks(current), event);
      const next = applyGroupedTasks(
        current,
        grouped as Record<string, BoardStatus['tasks']>,
      );
      latestRef.current = next;
      return next;
    });
  }

  /** Restores canceled drags or persists the final optimistic board. */
  function handleDragEnd(event: DragEndEvent) {
    const sourceId = event.operation.source?.id;
    if (event.canceled || !sourceId) {
      setStatuses(snapshotRef.current);
      latestRef.current = snapshotRef.current;
      return;
    }
    void onPersistDrag(
      String(sourceId),
      snapshotRef.current,
      latestRef.current,
    );
  }

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board" aria-label="Task board">
        {statuses.map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            properties={properties}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DragDropProvider>
  );
}
