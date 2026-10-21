import { db } from '@/lib/db/client';
import { taskService } from '@/lib/tasks';
import { propertyService } from '@/lib/properties';
import { endpoint } from '@/lib/api/endpoint';
import { listTaskPage } from '@/lib/api/pagination';
import {
  emptyInput,
  propertyValue,
  taskCreate,
  taskMove,
  taskQuery,
  tasksReorder,
  taskUpdate,
} from '@/lib/api/schemas';

export const taskEndpoints = [
  endpoint(
    'GET',
    '/tasks',
    'List and filter complete task history',
    taskQuery,
    'TasksPage',
    (input) => listTaskPage(db, input),
  ),
  endpoint(
    'POST',
    '/tasks',
    'Create a task',
    taskCreate,
    'Task',
    async (input) => {
      const task = await taskService.create(input);
      return taskService.getById(task.id);
    },
  ),
  endpoint(
    'GET',
    '/tasks/{id}',
    'Get a task with its status and property values',
    emptyInput,
    'Task',
    (_, { id }) => taskService.getById(id),
  ),
  endpoint(
    'PATCH',
    '/tasks/{id}',
    'Update a task; propertyValues replaces the complete value set',
    taskUpdate,
    'Task',
    async (input, { id }) => {
      await taskService.update({ ...input, id });
      return taskService.getById(id);
    },
  ),
  endpoint(
    'DELETE',
    '/tasks/{id}',
    'Permanently delete a task',
    emptyInput,
    'Empty',
    (_, { id }) => taskService.delete(id),
  ),
  endpoint(
    'POST',
    '/tasks/{id}/move',
    'Move a task; completion metadata is maintained automatically',
    taskMove,
    'Task',
    async (input, { id }) => {
      await taskService.move({ ...input, id });
      return taskService.getById(id);
    },
  ),
  endpoint(
    'PUT',
    '/statuses/{id}/tasks/order',
    'Set the complete order of an active status',
    tasksReorder,
    'Empty',
    (input, { id }) => taskService.reorder({ ...input, statusId: id }),
  ),
  endpoint(
    'PUT',
    '/tasks/{id}/properties/{propertyId}',
    'Set a single typed property value',
    propertyValue,
    'PropertyValue',
    (input, { id, propertyId }) =>
      propertyService.setValue({ ...input, taskId: id, propertyId }),
  ),
  endpoint(
    'DELETE',
    '/tasks/{id}/properties/{propertyId}',
    'Clear one property value',
    emptyInput,
    'Empty',
    (_, { id, propertyId }) => propertyService.deleteValue(id, propertyId),
  ),
];
