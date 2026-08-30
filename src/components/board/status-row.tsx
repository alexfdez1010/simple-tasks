'use client';

import { Button, Card } from '@heroui/react';
import { useState } from 'react';

import { ChevronIcon, EditIcon } from '@/components/board/icons';
import { ConfirmationDialog } from '@/components/board/confirmation-dialog';
import { StatusForm } from '@/components/board/status-form';
import type {
  BoardStatus,
  MutationResult,
  StatusValues,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface StatusRowProps {
  status: BoardStatus;
  isFirst: boolean;
  isLast: boolean;
  onSave: (values: StatusValues) => Promise<MutationResult>;
  onDelete: () => Promise<MutationResult>;
  onReorder: (direction: -1 | 1) => Promise<MutationResult>;
}

/**
 * Renders one state summary with edit, reorder, and delete controls.
 *
 * @param props - Workflow state and mutation callbacks.
 * @returns A compact HeroUI card or its inline edit form.
 */
export function StatusRow({
  status,
  isFirst,
  isLast,
  onSave,
  onDelete,
  onReorder,
}: StatusRowProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Saves changes and closes the editor on success. */
  async function handleSave(values: StatusValues) {
    const result = await onSave(values);
    if (result.success) setIsEditing(false);
    return result;
  }

  /** Persists deletion and reports whether the confirmation may close. */
  async function handleDelete(): Promise<boolean> {
    const result = await onDelete();
    setError(
      result.success ? null : (result.error ?? t('status.deleteFallback')),
    );
    return result.success;
  }

  if (isEditing) {
    return (
      <Card className="border border-divider p-4" variant="secondary">
        <StatusForm
          initialValues={{
            name: status.name,
            color: status.color,
            isTerminal: status.isTerminal,
          }}
          submitLabel={t('status.save')}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      </Card>
    );
  }

  return (
    <Card className="gap-3 border border-divider p-4" variant="default">
      <div className="flex items-center gap-3">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: status.color }}
        />
        <Card.Header className="min-w-0 flex-1 gap-0">
          <Card.Title className="truncate text-base">{status.name}</Card.Title>
          <Card.Description>
            {status.isTerminal
              ? t('status.latestTasks', { count: 20 })
              : t(
                  status.tasks.length === 1
                    ? 'status.taskCount.one'
                    : 'status.taskCount.other',
                  { count: status.tasks.length },
                )}
          </Card.Description>
        </Card.Header>
        <div className="flex gap-1">
          <Button
            isIconOnly
            isDisabled={isFirst}
            size="sm"
            variant="ghost"
            aria-label={t('status.moveLeft', { name: status.name })}
            onPress={() => void onReorder(-1)}
          >
            <ChevronIcon className="size-4 rotate-180" />
          </Button>
          <Button
            isIconOnly
            isDisabled={isLast}
            size="sm"
            variant="ghost"
            aria-label={t('status.moveRight', { name: status.name })}
            onPress={() => void onReorder(1)}
          >
            <ChevronIcon className="size-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={t('status.edit', { name: status.name })}
            onPress={() => setIsEditing(true)}
          >
            <EditIcon className="size-4" />
          </Button>
        </div>
      </div>
      <ConfirmationDialog
        body={t('status.deleteBody', { name: status.name })}
        confirmLabel={t('status.delete')}
        heading={t('status.deleteHeading', { name: status.name })}
        triggerAriaLabel={t('status.deleteAria', { name: status.name })}
        triggerLabel={t('status.delete')}
        triggerVariant="danger-soft"
        onConfirm={handleDelete}
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
