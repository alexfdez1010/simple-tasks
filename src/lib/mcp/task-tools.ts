import 'server-only';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { runMcpTool } from '@/lib/mcp/shared';
import {
  MAX_PROPERTY_OPTIONS,
  MAX_TASK_PROPERTIES,
} from '@/lib/properties/limits';
import { taskService } from '@/lib/tasks';
import { idSchema } from '@/lib/validation/common';

const id = idSchema;
const propertyValue = z.object({
  propertyId: id,
  value: z.union([
    z.string().max(20_000),
    z.number().finite(),
    z.array(z.string().max(80)).max(MAX_PROPERTY_OPTIONS),
  ]),
});

/** Registers every MCP task query and mutation against the shared task service. */
export function registerTaskTools(server: McpServer): void {
  server.registerTool(
    'list_board',
    {
      title: 'List the Kanban board',
      description:
        'Return ordered statuses and tasks. Non-terminal statuses sort by due date ascending; terminal statuses sort by completion date descending and include only their 20 latest completions.',
      inputSchema: {},
    },
    async () => runMcpTool(() => taskService.listBoard()),
  );
  server.registerTool(
    'get_task',
    {
      title: 'Get a task',
      description: 'Return one task and its status by task id.',
      inputSchema: { id },
    },
    async ({ id: taskId }) => runMcpTool(() => taskService.getById(taskId)),
  );
  server.registerTool(
    'create_task',
    {
      title: 'Create a task',
      description:
        'Create a task at the end of a status. Omit statusId to use the first non-terminal status.',
      inputSchema: {
        title: z.string().trim().min(1).max(160),
        description: z.string().max(20_000).nullable().optional(),
        dueDate: z.string().datetime().nullable().optional(),
        statusId: id.optional(),
        propertyValues: z
          .array(propertyValue)
          .max(MAX_TASK_PROPERTIES)
          .optional(),
      },
    },
    async (input) => runMcpTool(() => taskService.create(input)),
  );
  server.registerTool(
    'update_task',
    {
      title: 'Update a task',
      description:
        'Atomically update task fields and optionally move it by sending statusId and index together. Omitted fields remain unchanged. propertyValues replaces the complete value set; use set_task_property_value to change only one.',
      inputSchema: {
        id,
        title: z.string().trim().min(1).max(160).optional(),
        description: z.string().max(20_000).nullable().optional(),
        dueDate: z.string().datetime().nullable().optional(),
        statusId: id.optional(),
        index: z.number().int().nonnegative().optional(),
        propertyValues: z
          .array(propertyValue)
          .max(MAX_TASK_PROPERTIES)
          .optional(),
      },
    },
    async (input) => runMcpTool(() => taskService.update(input)),
  );
  server.registerTool(
    'move_task',
    {
      title: 'Move a task',
      description:
        'Move a task to a zero-based index in a target status. Completion metadata is maintained automatically.',
      inputSchema: { id, statusId: id, index: z.number().int().nonnegative() },
    },
    async (input) => runMcpTool(() => taskService.move(input)),
  );
  server.registerTool(
    'reorder_tasks',
    {
      title: 'Reorder a task column',
      description:
        'Set the complete order of a non-terminal status. taskIds must contain every task exactly once.',
      inputSchema: { statusId: id, taskIds: z.array(id) },
    },
    async (input) =>
      runMcpTool(async () => {
        await taskService.reorder(input);
        return { reordered: input.taskIds };
      }),
  );
  server.registerTool(
    'delete_task',
    {
      title: 'Delete a task',
      description:
        'Permanently delete a task by id. Confirm with the user before calling.',
      inputSchema: { id },
    },
    async ({ id: taskId }) =>
      runMcpTool(async () => {
        await taskService.delete(taskId);
        return { deleted: taskId };
      }),
  );
}
