import type {
  BoardStatus,
  BoardTask,
  TaskValues,
} from '@/components/board/types';

const TERMINAL_TASK_LIMIT = 20;

/** Assigns contiguous positions without mutating task objects. */
function positionTasks(tasks: BoardTask[]): BoardTask[] {
  return tasks.map((task, position) => ({ ...task, position }));
}

/** Inserts a task according to the ordering contract of its destination. */
function insertTask(status: BoardStatus, task: BoardTask): BoardTask[] {
  const tasks = status.isTerminal
    ? [task, ...status.tasks].slice(0, TERMINAL_TASK_LIMIT)
    : [...status.tasks, task];
  return positionTasks(tasks);
}

/** Deep-clones the serializable board for optimistic rollback. */
export function cloneBoard(statuses: BoardStatus[]): BoardStatus[] {
  return structuredClone(statuses);
}

/** Finds a task and its state in the current board. */
export function findTask(
  statuses: BoardStatus[],
  taskId: string,
): { status: BoardStatus; task: BoardTask; index: number } | null {
  for (const status of statuses) {
    const index = status.tasks.findIndex((task) => task.id === taskId);
    if (index >= 0) return { status, task: status.tasks[index], index };
  }
  return null;
}

/** Inserts a temporary task according to its selected state's ordering. */
export function addTask(
  statuses: BoardStatus[],
  values: TaskValues,
  id: string,
): BoardStatus[] {
  const now = new Date().toISOString();
  const task: BoardTask = {
    id,
    title: values.title,
    description: values.description || null,
    dueDate: values.dueDate || null,
    statusId: values.statusId,
    position: statusPosition(statuses, values.statusId),
    updatedAt: now,
    createdAt: now,
    completedAt: null,
    propertyValues: values.propertyValues ?? [],
  };
  return statuses.map((status) => {
    if (status.id !== values.statusId) return status;
    return { ...status, tasks: insertTask(status, task) };
  });
}

/** Replaces a temporary task id with the canonical id returned by persistence. */
export function replaceTaskId(
  statuses: BoardStatus[],
  temporaryId: string,
  persistedId: string,
): BoardStatus[] {
  return statuses.map((status) => ({
    ...status,
    tasks: status.tasks.map((task) =>
      task.id === temporaryId ? { ...task, id: persistedId } : task,
    ),
  }));
}

/** Returns the optimistic insertion position for a destination state. */
function statusPosition(statuses: BoardStatus[], statusId: string): number {
  const status = statuses.find((item) => item.id === statusId);
  return status?.isTerminal ? 0 : (status?.tasks.length ?? 0);
}

/** Applies editable values and moves a task when its state changed. */
export function editTask(
  statuses: BoardStatus[],
  taskId: string,
  values: TaskValues,
): BoardStatus[] {
  const located = findTask(statuses, taskId);
  if (!located) return statuses;
  const updated = {
    ...located.task,
    title: values.title,
    description: values.description || null,
    dueDate: values.dueDate || null,
    statusId: values.statusId,
    updatedAt: new Date().toISOString(),
    completedAt: located.task.completedAt,
    propertyValues: values.propertyValues ?? located.task.propertyValues,
  };

  if (located.status.id === values.statusId) {
    return statuses.map((status) =>
      status.id === values.statusId
        ? {
            ...status,
            tasks: status.tasks.map((task) =>
              task.id === taskId ? updated : task,
            ),
          }
        : status,
    );
  }

  return statuses.map((status) => {
    if (status.id === located.status.id) {
      return {
        ...status,
        tasks: positionTasks(status.tasks.filter((task) => task.id !== taskId)),
      };
    }
    if (status.id === values.statusId) {
      return { ...status, tasks: insertTask(status, updated) };
    }
    return status;
  });
}

/** Removes a task and compacts local positions. */
export function removeTask(
  statuses: BoardStatus[],
  taskId: string,
): BoardStatus[] {
  return statuses.map((status) => ({
    ...status,
    tasks: positionTasks(status.tasks.filter((task) => task.id !== taskId)),
  }));
}

/** Moves a task according to the selected state's ordering. */
export function moveTaskToStatus(
  statuses: BoardStatus[],
  taskId: string,
  statusId: string,
): BoardStatus[] {
  const located = findTask(statuses, taskId);
  if (!located || located.status.id === statusId) return statuses;
  return editTask(statuses, taskId, {
    title: located.task.title,
    description: located.task.description ?? '',
    dueDate: located.task.dueDate?.slice(0, 10) ?? '',
    statusId,
    propertyValues: located.task.propertyValues,
  });
}
