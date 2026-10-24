import type { BoardTask, TaskValues } from '@/components/board/types';

/** Converts a persisted task into editable HTML form values. */
export function getInitialValues(
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
