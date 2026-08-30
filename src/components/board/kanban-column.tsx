'use client';

import { useDroppable } from '@dnd-kit/react';
import { Button } from '@heroui/react';

import { PlusIcon } from '@/components/board/icons';
import { TaskCard } from '@/components/board/task-card';
import { TaskDialog } from '@/components/board/task-dialog';
import type {
  BoardStatus,
  MutationResult,
  PropertyDefinition,
  TaskValues,
} from '@/components/board/types';

interface KanbanColumnProps {
  status: BoardStatus;
  properties: PropertyDefinition[];
  onCreate: (values: TaskValues) => Promise<MutationResult>;
  onUpdate: (taskId: string, values: TaskValues) => Promise<MutationResult>;
  onDelete: (taskId: string) => Promise<MutationResult>;
}

/**
 * Renders one workflow column and its sortable task list.
 *
 * @param props - State data and task mutation callbacks.
 * @returns A named, droppable Kanban region.
 */
export function KanbanColumn({
  status,
  properties,
  onCreate,
  onUpdate,
  onDelete,
}: KanbanColumnProps) {
  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: status.id,
    type: 'column',
    accept: 'task',
    data: { statusId: status.id },
  });

  return (
    <section
      className={`kanban-column ${isDropTarget ? 'is-drop-target' : ''}`}
      aria-labelledby={`status-${status.id}`}
      style={{ '--status-color': status.color } as React.CSSProperties}
    >
      <header className="kanban-column-header">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="status-dot" aria-hidden="true" />
            <h2
              id={`status-${status.id}`}
              className="truncate text-sm font-semibold tracking-tight"
            >
              {status.name}
            </h2>
            <span
              className="status-count"
              aria-label={`${status.tasks.length} ${status.tasks.length === 1 ? 'task' : 'tasks'}`}
            >
              {status.tasks.length}
            </span>
          </div>
          {status.isTerminal ? (
            <p className="mt-0.5 ps-4 text-[11px] text-muted">
              Latest 20 tasks
            </p>
          ) : null}
        </div>
        <TaskDialog
          createContext={status.name}
          defaultStatusId={status.id}
          properties={properties}
          trigger={
            <Button
              className="column-add-button"
              size="sm"
              variant="ghost"
              aria-label={`Add task to ${status.name}`}
            >
              <PlusIcon className="size-3.5" />
              Add
            </Button>
          }
          onSave={onCreate}
        />
      </header>

      <div
        ref={droppableRef}
        className="kanban-task-list"
        role="list"
        aria-label={`${status.name} tasks`}
      >
        {status.tasks.length === 0 ? (
          <div className="kanban-empty-state">
            <span className="kanban-empty-icon" aria-hidden="true">
              <PlusIcon className="size-4" />
            </span>
            <p className="font-medium text-foreground">No tasks here</p>
            <p className="text-[11px] leading-4 text-muted">
              Add one or move work into this stage.
            </p>
          </div>
        ) : (
          status.tasks.map((task, index) => (
            <div className="kanban-task-item" key={task.id} role="listitem">
              <TaskCard
                task={task}
                index={index}
                properties={properties}
                onSave={(values) => onUpdate(task.id, values)}
                onDelete={() => onDelete(task.id)}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
