'use client';

import { Drawer, useOverlayState } from '@heroui/react';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { getInitialValues } from '@/components/board/task-initial-values';
import { TaskDrawerFooter } from '@/components/board/task-drawer-footer';
import { TaskMove } from '@/components/board/task-move';
import { TaskDialogTrigger } from '@/components/board/task-dialog-trigger';
import { TaskDetail } from '@/components/board/task-detail';
import { TaskForm } from '@/components/board/task-form';
import type {
  BoardStatus,
  BoardTask,
  MutationResult,
  PropertyDefinition,
  TaskValues,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface TaskDialogProps {
  properties: PropertyDefinition[];
  initialTitle?: string;
  onCreated?: () => void;
  statuses?: BoardStatus[];
  task?: BoardTask;
  defaultStatusId?: string;
  createContext?: string;
  trigger?: ReactElement | null;
  onMove?: (statusId: string) => Promise<MutationResult>;
  onSave: (values: TaskValues) => Promise<MutationResult>;
  onDelete?: () => Promise<MutationResult>;
  status?: BoardStatus;
  mode?: 'edit' | 'view';
  state?: ModalState;
}

type ModalState = ReturnType<typeof useOverlayState>;

/**
 * Renders creation, editing and inspection in a responsive task drawer.
 *
 * @param props - Task data, default placement, properties, and persistence callbacks.
 * @returns A HeroUI trigger and drawer containing task details or its form.
 */
export function TaskDialog({
  properties,
  task,
  defaultStatusId,
  createContext,
  trigger,
  onMove,
  onSave,
  onDelete,
  status,
  mode = 'edit',
  state,
  initialTitle = '',
  onCreated,
  statuses = [],
}: TaskDialogProps) {
  const { t } = useI18n();
  const localModalState = useOverlayState();
  const modalState = state ?? localModalState;
  const [isPending, setIsPending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const formId = task
    ? `edit-task-${task.id}`
    : `create-task-${defaultStatusId ?? 'default'}`;
  const heading = task
    ? isEditing
      ? t('task.edit')
      : task.title
    : createContext
      ? t('task.createIn', { status: createContext })
      : t('task.new');

  /** Resets inspection mode when controlled closes bypass the overlay's internal event. */
  function closeDrawer() {
    modalState.close();
    setIsEditing(mode === 'edit');
    setDeleteError(null);
  }

  /** Deletes the task and reports whether the confirmation may close. */
  async function handleDelete(): Promise<boolean> {
    if (!onDelete) return false;
    const result = await onDelete();
    if (result.success) {
      closeDrawer();
      return true;
    }
    setDeleteError(result.error ?? t('task.deleteFallback'));
    return false;
  }

  /** Persists form values while exposing pending state to the modal action. */
  async function handleSave(values: TaskValues) {
    setIsPending(true);
    try {
      return await onSave(values);
    } catch {
      return { success: false, error: t('task.saveFallback') };
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Drawer state={modalState}>
      {trigger !== undefined ? (
        trigger
      ) : (
        <TaskDialogTrigger task={task} onPress={() => setDeleteError(null)} />
      )}

      <Drawer.Backdrop
        isDismissable={!isEditing && !isPending}
        isKeyboardDismissDisabled={isPending}
        onOpenChange={(isOpen) => {
          modalState.setOpen(isOpen);
          if (!isOpen) setIsEditing(mode === 'edit');
        }}
      >
        <Drawer.Content className="task-drawer-content" placement="right">
          <Drawer.Dialog className="task-drawer-dialog">
            <Drawer.CloseTrigger isDisabled={isPending} />
            <Drawer.Header>
              <Drawer.Heading>{heading}</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              {task && !isEditing ? (
                <>
                  {statuses.length > 0 && onMove ? (
                    <TaskMove
                      statusId={task.statusId}
                      statuses={statuses}
                      onMove={async (id) => {
                        setIsPending(true);
                        try {
                          return await onMove(id);
                        } finally {
                          setIsPending(false);
                        }
                      }}
                      onMoved={closeDrawer}
                    />
                  ) : null}
                  <TaskDetail
                    task={task}
                    status={status}
                    properties={properties}
                  />
                </>
              ) : (
                <TaskForm
                  key={`${formId}-${task?.updatedAt ?? 'new'}`}
                  id={formId}
                  initialValues={
                    task
                      ? getInitialValues(task)
                      : {
                          ...getInitialValues(undefined, defaultStatusId),
                          title: initialTitle,
                        }
                  }
                  properties={properties}
                  onSave={handleSave}
                  onSaved={() => {
                    closeDrawer();
                    if (!task) onCreated?.();
                  }}
                />
              )}
              {deleteError ? (
                <p className="text-sm text-danger" role="alert">
                  {deleteError}
                </p>
              ) : null}
            </Drawer.Body>
            <TaskDrawerFooter
              task={task}
              editing={isEditing}
              pending={isPending}
              formId={formId}
              onEdit={() => setIsEditing(true)}
              onClose={closeDrawer}
              onDelete={handleDelete}
            />
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
