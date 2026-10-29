import { endpoint } from '@/lib/api/endpoint';
import { coordinationService } from '@/lib/coordination';
import {
  assigneeFields,
  projectFields,
  readyQuery,
  startTaskSchema,
  updateAssigneeSchema,
  updateProjectSchema,
} from '@/lib/coordination/schemas';
import { z } from 'zod';

const empty = z.object({}).strict();

export const coordinationEndpoints = [
  endpoint(
    'GET',
    '/assignees',
    'List humans and agents',
    empty,
    'Assignees',
    () => coordinationService.listAssignees(),
  ),
  endpoint(
    'POST',
    '/assignees',
    'Create a responsible party',
    assigneeFields.strict(),
    'Assignee',
    (input) => coordinationService.createAssignee(input),
  ),
  endpoint(
    'PATCH',
    '/assignees/{id}',
    'Update a responsible party',
    updateAssigneeSchema.omit({ id: true }).strict(),
    'Assignee',
    (input, { id }) => coordinationService.updateAssignee({ ...input, id }),
  ),
  endpoint('GET', '/projects', 'List projects', empty, 'Projects', () =>
    coordinationService.listProjects(),
  ),
  endpoint(
    'POST',
    '/projects',
    'Create a project',
    projectFields.strict(),
    'Project',
    (input) => coordinationService.createProject(input),
  ),
  endpoint(
    'PATCH',
    '/projects/{id}',
    'Update a project',
    updateProjectSchema.omit({ id: true }).strict(),
    'Project',
    (input, { id }) => coordinationService.updateProject({ ...input, id }),
  ),
  endpoint(
    'GET',
    '/tasks/ready',
    'List assigned work with completed prerequisites',
    readyQuery
      .extend({ limit: z.coerce.number().int().min(1).max(100).default(20) })
      .strict(),
    'ReadyTasks',
    (input) => coordinationService.ready(input),
  ),
  endpoint(
    'POST',
    '/tasks/{id}/start',
    'Start available work atomically',
    startTaskSchema.omit({ id: true }).strict(),
    'Task',
    (input, { id }) => coordinationService.start({ ...input, id }),
  ),
];
