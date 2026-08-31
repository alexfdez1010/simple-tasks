'use client';

import { Button, Modal, useOverlayState } from '@heroui/react';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { ConfirmationDialog } from '@/components/board/confirmation-dialog';
import { EditIcon, PlusIcon } from '@/components/board/icons';
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
  task?: BoardTask;
  defaultStatusId?: string;
  createContext?: string;
  trigger?: ReactElement | null;
  onSave: (values: TaskValues) => Promise<MutationResult>;
  onDelete?: () => Promise<MutationResult>;
  status?: BoardStatus;
  mode?: 'edit' | 'view';
  state?: ModalState;
}

interface ModalState {
  close: () => void;
  isOpen: boolean;
  open: () => void;
  setOpen: (isOpen: boolean) => void;
  toggle: () => void;
}

/** Converts a persisted task into editable HTML form values. */
function getInitialValues(
  task?: BoardTask,
  defaultStatusId?: string,
): TaskValues {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    dueDate: task?.dueDate?.slice(0, 10) ?? '',
    statusId: task?.statusId ?? defaultStatusId ?? '',
    propertyValues: task?.propertyValues ?? [],
  };
}

/**
 * Renders the create or edit task modal.
 *
 * @param props - Task data, default placement, properties, and persistence callbacks.
 * @returns A HeroUI trigger and compound modal containing the task form.
 */
export function TaskDialog({
  properties,
  task,
  defaultStatusId,
  createContext,
  trigger,
  onSave,
  onDelete,
  status,
  mode = 'edit',
  state,
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

  /** Deletes the task and reports whether the confirmation may close. */
  async function handleDelete(): Promise<boolean> {
    if (!onDelete) return false;
    const result = await onDelete();
    if (result.success) {
      modalState.close();
      return true;
    }
    setDeleteError(result.error ?? t('task.deleteFallback'));
    return false;
  }

  /** Persists form values while exposing pending state to the modal action. */
  async function handleSave(values: TaskValues) {
    setIsPending(true);
    const result = await onSave(values);
    setIsPending(false);
    return result;
  }

  return (
    <Modal state={modalState}>
      {trigger !== undefined ? (
        trigger
      ) : (
        <Button
          className={task ? 'task-edit-button' : undefined}
          isIconOnly={Boolean(task)}
          size={task ? 'sm' : 'md'}
          variant={task ? 'ghost' : 'primary'}
          aria-label={
            task ? t('task.editAria', { title: task.title }) : undefined
          }
          onPress={() => setDeleteError(null)}
        >
          {task ? (
            <EditIcon className="size-4" />
          ) : (
            <PlusIcon className="size-4" />
          )}
          {task ? null : t('task.new')}
        </Button>
      )}

      <Modal.Backdrop
        onOpenChange={(isOpen) => {
          modalState.setOpen(isOpen);
          if (!isOpen) setIsEditing(mode === 'edit');
        }}
      >
        <Modal.Container
          className="board-modal-container"
          placement="auto"
          size="lg"
        >
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{heading}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {task && !isEditing ? (
                <TaskDetail
                  task={task}
                  status={status}
                  properties={properties}
                />
              ) : (
                <TaskForm
                  key={`${formId}-${task?.updatedAt ?? 'new'}`}
                  id={formId}
                  initialValues={getInitialValues(task, defaultStatusId)}
                  properties={properties}
                  onSave={handleSave}
                  onSaved={modalState.close}
                />
              )}
              {deleteError ? (
                <p className="text-sm text-danger" role="alert">
                  {deleteError}
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer className="justify-between">
              {task && isEditing ? (
                <ConfirmationDialog
                  body={t('task.deleteBody')}
                  confirmLabel={t('task.deleteTask')}
                  heading={t('task.deleteHeading', { title: task.title })}
                  triggerLabel={t('task.delete')}
                  onConfirm={handleDelete}
                />
              ) : task ? (
                <Button variant="secondary" onPress={() => setIsEditing(true)}>
                  {t('common.edit')}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button slot="close" variant="ghost">
                  {t('common.cancel')}
                </Button>
                {isEditing ? (
                  <Button type="submit" form={formId} isPending={isPending}>
                    {t('common.save')}
                  </Button>
                ) : null}
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
