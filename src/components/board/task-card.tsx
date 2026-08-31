'use client';

import { Card, useOverlayState } from '@heroui/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useDateFormatter } from '@react-aria/i18n';

import { CalendarIcon, GripIcon } from '@/components/board/icons';
import { Markdown } from '@/components/board/markdown';
import { TaskDialog } from '@/components/board/task-dialog';
import { TaskPropertySummary } from '@/components/board/task-property-summary';
import type {
  BoardTask,
  BoardStatus,
  MutationResult,
  PropertyDefinition,
  TaskValues,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface TaskCardProps {
  task: BoardTask;
  status: BoardStatus;
  index: number;
  properties: PropertyDefinition[];
  onSave: (values: TaskValues) => Promise<MutationResult>;
  onDelete: () => Promise<MutationResult>;
}

/**
 * Renders a compact sortable task card with content editing controls.
 *
 * @param props - Task data, position, property definitions, and callbacks.
 * @returns A draggable article backed by a HeroUI compound Card.
 */
export function TaskCard({
  task,
  status,
  index,
  properties,
  onSave,
  onDelete,
}: TaskCardProps) {
  const { t } = useI18n();
  const detailState = useOverlayState();
  const dateFormatter = useDateFormatter({
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const {
    ref: sortableRef,
    handleRef,
    isDragging,
  } = useSortable({
    id: task.id,
    index,
    group: task.statusId,
    type: 'task',
    accept: 'task',
    transition: {
      duration: 180,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      idle: true,
    },
  });

  /** Opens the read-only task inspector from a safe card content zone. */
  function openDetails() {
    detailState.open();
  }

  /** Gives keyboard users the same card-level detail affordance. */
  function openDetailsFromKeyboard(event: React.KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      detailState.open();
    }
  }

  return (
    <article
      ref={sortableRef}
      className={`task-card-wrapper ${isDragging ? 'is-dragging' : ''}`}
      aria-label={task.title}
    >
      <Card className="task-card gap-0 border-0 p-0" variant="default">
        <Card.Header className="task-card-header flex-row items-start gap-2">
          <button
            ref={handleRef}
            type="button"
            className="drag-handle grid shrink-0 place-items-center rounded-lg text-muted"
            aria-label={t('task.drag', { title: task.title })}
          >
            <GripIcon className="size-3.5" />
          </button>
          <Card.Title
            className="task-card-title-trigger min-w-0 flex-1 text-left"
            role="button"
            tabIndex={0}
            aria-label={t('task.openDetails', { title: task.title })}
            onClick={openDetails}
            onKeyDown={openDetailsFromKeyboard}
          >
            {task.title}
          </Card.Title>
          <TaskDialog
            task={task}
            properties={properties}
            onSave={onSave}
            onDelete={onDelete}
          />
        </Card.Header>

        <div
          className="task-card-body-trigger"
          role="button"
          tabIndex={0}
          aria-label={t('task.openDetails', { title: task.title })}
          onClick={openDetails}
          onKeyDown={openDetailsFromKeyboard}
        >
          {task.description ? (
            <Card.Content className="task-description-preview mx-3 mb-2.5 ms-16 text-[13px] text-muted md:ms-12">
              <Markdown>{task.description}</Markdown>
            </Card.Content>
          ) : null}

          {task.propertyValues.length > 0 ? (
            <Card.Content className="mx-3 mb-2.5 ms-16 md:ms-12">
              <TaskPropertySummary
                properties={properties}
                values={task.propertyValues}
              />
            </Card.Content>
          ) : null}

          {task.dueDate ? (
            <Card.Footer className="task-card-footer ms-16 md:ms-12">
              <p className="task-date-chip">
                <CalendarIcon className="size-3" />
                <time dateTime={task.dueDate}>
                  {t('task.due', {
                    date: dateFormatter.format(new Date(task.dueDate)),
                  })}
                </time>
              </p>
            </Card.Footer>
          ) : null}
        </div>
        <TaskDialog
          mode="view"
          state={detailState}
          task={task}
          status={status}
          properties={properties}
          trigger={null}
          onSave={onSave}
          onDelete={onDelete}
        />
      </Card>
    </article>
  );
}
