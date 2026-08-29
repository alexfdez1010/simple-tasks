'use client';

import { Button, Modal, useOverlayState } from '@heroui/react';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { ConfirmationDialog } from '@/components/board/confirmation-dialog';
import { EditIcon, PlusIcon } from '@/components/board/icons';
import { TaskForm } from '@/components/board/task-form';
import type {
  BoardTask,
  MutationResult,
  PropertyDefinition,
  TaskValues,
} from '@/components/board/types';

interface TaskDialogProps {
  properties: PropertyDefinition[];
  task?: BoardTask;
  defaultStatusId?: string;
  createContext?: string;
  trigger?: ReactElement;
  onSave: (values: TaskValues) => Promise<MutationResult>;
  onDelete?: () => Promise<MutationResult>;
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
}: TaskDialogProps) {
  const modalState = useOverlayState();
  const [isPending, setIsPending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const formId = task
    ? `edit-task-${task.id}`
    : `create-task-${defaultStatusId ?? 'default'}`;
  const heading = task
    ? 'Edit task'
    : `Create task${createContext ? ` in ${createContext}` : ''}`;

  /** Deletes the task and reports whether the confirmation may close. */
  async function handleDelete(): Promise<boolean> {
    if (!onDelete) return false;
    const result = await onDelete();
    if (result.success) {
      modalState.close();
      return true;
    }
    setDeleteError(result.error ?? 'The task could not be deleted.');
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
      {trigger ?? (
        <Button
          isIconOnly={Boolean(task)}
          size={task ? 'sm' : 'md'}
          variant={task ? 'ghost' : 'primary'}
          aria-label={task ? `Edit ${task.title}` : undefined}
          onPress={() => setDeleteError(null)}
        >
          {task ? (
            <EditIcon className="size-4" />
          ) : (
            <PlusIcon className="size-4" />
          )}
          {task ? null : 'New task'}
        </Button>
      )}

      <Modal.Backdrop>
        <Modal.Container placement="center" size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{heading}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <TaskForm
                key={`${formId}-${task?.updatedAt ?? 'new'}`}
                id={formId}
                initialValues={getInitialValues(task, defaultStatusId)}
                properties={properties}
                onSave={handleSave}
                onSaved={modalState.close}
              />
              {deleteError ? (
                <p className="text-sm text-danger" role="alert">
                  {deleteError}
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer className="justify-between">
              {task ? (
                <ConfirmationDialog
                  body="This task and its property values will be permanently removed."
                  confirmLabel="Delete task"
                  heading={`Delete “${task.title}”?`}
                  triggerLabel="Delete"
                  onConfirm={handleDelete}
                />
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button slot="close" variant="ghost">
                  Cancel
                </Button>
                <Button type="submit" form={formId} isPending={isPending}>
                  Save
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
