'use client';

import { Button, Drawer } from '@heroui/react';
import { ConfirmationDialog } from '@/components/board/confirmation-dialog';
import type { BoardTask } from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface TaskDrawerFooterProps {
  task?: BoardTask;
  editing: boolean;
  pending: boolean;
  formId: string;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => Promise<boolean>;
}

/** Keeps explicit save/cancel and destructive confirmation reachable outside the scrolling body. */
export function TaskDrawerFooter({
  task,
  editing,
  pending,
  formId,
  onEdit,
  onClose,
  onDelete,
}: TaskDrawerFooterProps) {
  const { t } = useI18n();
  return (
    <Drawer.Footer className="task-drawer-footer flex-wrap justify-between gap-2">
      {task && editing ? (
        <ConfirmationDialog
          isDisabled={pending}
          body={t('task.deleteBody')}
          confirmLabel={t('task.deleteTask')}
          heading={t('task.deleteHeading', { title: task.title })}
          triggerLabel={t('task.delete')}
          onConfirm={onDelete}
        />
      ) : task ? (
        <Button
          className="min-h-11"
          variant="secondary"
          isDisabled={pending}
          onPress={onEdit}
        >
          {t('common.edit')}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button
          className="min-h-11"
          variant="ghost"
          isDisabled={pending}
          onPress={onClose}
        >
          {t('common.cancel')}
        </Button>
        {editing ? (
          <Button
            className="min-h-11"
            type="submit"
            form={formId}
            isPending={pending}
          >
            {t('common.save')}
          </Button>
        ) : null}
      </div>
    </Drawer.Footer>
  );
}
