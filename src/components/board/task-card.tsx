'use client';

import { Button, Card, useOverlayState } from '@heroui/react';
import { useSortable } from '@dnd-kit/react/sortable';

import { GripIcon } from '@/components/board/icons';
import { TaskDialog } from '@/components/board/task-dialog';
import { Markdown } from '@/components/board/markdown';
import { TaskCardMeta } from '@/components/board/task-card-meta';
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
  statuses?: BoardStatus[];
  index: number;
  properties: PropertyDefinition[];
  onMove?: (statusId: string) => Promise<MutationResult>;
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
  statuses = [],
  index,
  properties,
  onMove,
  onSave,
  onDelete,
}: TaskCardProps) {
  const { t } = useI18n();
  const detailState = useOverlayState();
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

  /**
   * Opens inspection from card content while preserving links and controls.
   * @param event - Pointer click bubbling from the card subtree.
   * @returns Nothing; opens the overlay only for noninteractive content.
   */
  function openDetailsFromCard(event: React.MouseEvent) {
    if (
      event.target instanceof Element &&
      event.target.closest('a, button, input, [role="button"], [role="dialog"]')
    ) {
      return;
    }
    detailState.open();
  }

  return (
    <article
      ref={sortableRef}
      className={`task-card-wrapper ${isDragging ? 'is-dragging' : ''}`}
      aria-label={task.title}
    >
      <Card
        className="task-card gap-0 border-0 p-0"
        variant="default"
        onClick={openDetailsFromCard}
      >
        <Card.Header className="task-card-header flex-row items-start gap-2">
          <button
            ref={handleRef}
            type="button"
            className="drag-handle grid shrink-0 place-items-center rounded-lg text-muted"
            aria-label={t('task.drag', { title: task.title })}
          >
            <GripIcon className="size-3.5" />
          </button>
          <Card.Title className="min-w-0 flex-1">
            <Button
              className="task-card-title-trigger h-auto min-h-8 w-full justify-start rounded-md px-0 py-1 text-left text-sm font-semibold whitespace-normal"
              variant="ghost"
              aria-label={t('task.openDetails', { title: task.title })}
              onPress={detailState.open}
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {task.title}
              </span>
            </Button>
          </Card.Title>
          <TaskDialog
            task={task}
            properties={properties}
            onSave={onSave}
            onDelete={onDelete}
          />
        </Card.Header>

        {task.description ? (
          <Card.Content className="task-description-preview mx-3 mb-3 text-[13px] leading-5 text-muted">
            <Markdown>{task.description}</Markdown>
          </Card.Content>
        ) : null}
        <TaskCardMeta task={task} properties={properties} />
        <TaskDialog
          mode="view"
          statuses={statuses}
          onMove={onMove}
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
