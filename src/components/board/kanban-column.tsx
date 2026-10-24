'use client';

import { useDroppable } from '@dnd-kit/react';
import { Button } from '@heroui/react';
import { useNumberFormatter } from '@react-aria/i18n';

import { PlusIcon } from '@/components/board/icons';
import { TaskCard } from '@/components/board/task-card';
import { useRef } from 'react';
import { QuickTaskCreate } from '@/components/board/quick-task-create';
import type {
  BoardStatus,
  MutationResult,
  PropertyDefinition,
  TaskValues,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface KanbanColumnProps {
  statuses: BoardStatus[];
  isCreating: boolean;
  onStartCreate: () => void;
  onStopCreate: () => void;
  status: BoardStatus;
  properties: PropertyDefinition[];
  onMove: (taskId: string, statusId: string) => Promise<MutationResult>;
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
  statuses,
  isCreating,
  onStartCreate,
  onStopCreate,
  properties,
  onMove,
  onCreate,
  onUpdate,
  onDelete,
}: KanbanColumnProps) {
  const { t } = useI18n();
  const addRef = useRef<HTMLButtonElement>(null);
  /** Returns focus to this column after capture is completed or cancelled. */
  function closeCapture() {
    onStopCreate();
    addRef.current?.focus();
  }
  const numberFormatter = useNumberFormatter();
  const taskCount = numberFormatter.format(status.tasks.length);
  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: status.id,
    type: 'column',
    accept: 'task',
    data: { statusId: status.id },
  });

  return (
    <section
      className={`kanban-column ${isDropTarget ? 'is-drop-target' : ''}`}
      data-status-id={status.id}
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
              aria-label={t(
                status.tasks.length === 1
                  ? 'task.count.one'
                  : 'task.count.other',
                { count: taskCount },
              )}
            >
              {taskCount}
            </span>
          </div>
          {status.isTerminal ? (
            <p className="mt-0.5 ps-4 text-[11px] text-muted">
              {t('task.latest', { count: 20 })}
            </p>
          ) : null}
        </div>
        <Button
          ref={addRef}
          className="column-add-button"
          size="sm"
          variant="ghost"
          aria-label={t('task.addTo', { status: status.name })}
          onPress={onStartCreate}
          aria-expanded={isCreating}
        >
          <PlusIcon className="size-3.5" />
          {t('task.add')}
        </Button>
      </header>

      {isCreating ? (
        <QuickTaskCreate
          status={status}
          properties={properties}
          onCreate={onCreate}
          onClose={closeCapture}
        />
      ) : null}
      <div
        ref={droppableRef}
        className="kanban-task-list"
        role="list"
        aria-label={t('task.list', { status: status.name })}
      >
        {status.tasks.length === 0 ? (
          <div className="kanban-empty-state">
            <span className="kanban-empty-icon" aria-hidden="true">
              <PlusIcon className="size-4" />
            </span>
            <p className="font-medium text-foreground">{t('task.empty')}</p>
            <p className="text-[11px] leading-4 text-muted">
              {t('task.emptyHint')}
            </p>
          </div>
        ) : (
          status.tasks.map((task, index) => (
            <div className="kanban-task-item" key={task.id} role="listitem">
              <TaskCard
                task={task}
                statuses={statuses}
                status={status}
                index={index}
                properties={properties}
                onMove={(statusId) => onMove(task.id, statusId)}
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
