'use client';

import { useDroppable } from '@dnd-kit/react';
import { Button } from '@heroui/react';
import { useNumberFormatter } from '@react-aria/i18n';

import { PlusIcon } from '@/components/board/icons';
import { TaskCard } from '@/components/board/task-card';
import { TaskDialog } from '@/components/board/task-dialog';
import type {
  BoardStatus,
  MutationResult,
  PropertyDefinition,
  TaskValues,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

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
  const { t } = useI18n();
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
        <TaskDialog
          createContext={status.name}
          defaultStatusId={status.id}
          properties={properties}
          trigger={
            <Button
              className="column-add-button"
              size="sm"
              variant="ghost"
              aria-label={t('task.addTo', { status: status.name })}
            >
              <PlusIcon className="size-3.5" />
              {t('task.add')}
            </Button>
          }
          onSave={onCreate}
        />
      </header>

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
                status={status}
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
