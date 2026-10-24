'use client';

import { Button } from '@heroui/react';
import { EditIcon, PlusIcon } from '@/components/board/icons';
import type { BoardTask } from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

/** Provides the standard creation/edit affordance inside the drawer's trigger context. */
export function TaskDialogTrigger({
  task,
  onPress,
}: {
  task?: BoardTask;
  onPress: () => void;
}) {
  const { t } = useI18n();
  return (
    <Button
      className={task ? 'task-edit-button' : undefined}
      isIconOnly={Boolean(task)}
      size={task ? 'sm' : 'md'}
      variant={task ? 'ghost' : 'primary'}
      aria-label={task ? t('task.editAria', { title: task.title }) : undefined}
      onPress={onPress}
    >
      {task ? <EditIcon className="size-4" /> : <PlusIcon className="size-4" />}
      {task ? null : t('task.new')}
    </Button>
  );
}
