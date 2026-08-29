import 'server-only';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { TaskPropertyType } from '@/generated/prisma';
import { runMcpTool } from '@/lib/mcp/shared';
import { propertyService } from '@/lib/properties';
import {
  MAX_PROPERTY_OPTIONS,
  MAX_TASK_PROPERTIES,
} from '@/lib/properties/limits';
import { idSchema } from '@/lib/validation/common';

const options = z
  .array(z.string().trim().min(1).max(80))
  .max(MAX_PROPERTY_OPTIONS);
const value = z.union([
  z.string().max(20_000),
  z.number().finite(),
  z.array(z.string().max(80)).max(MAX_PROPERTY_OPTIONS),
]);

/** Registers configurable-property definitions and value tools. */
export function registerPropertyTools(server: McpServer): void {
  server.registerTool(
    'list_properties',
    {
      title: 'List task properties',
      description: 'Return configurable task property definitions in order.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => runMcpTool(() => propertyService.list()),
  );
  server.registerTool(
    'create_property',
    {
      title: 'Create a task property',
      description:
        'Create a TEXT, NUMBER, DATE, SELECT, or MULTI_SELECT property. Selection types require options.',
      inputSchema: {
        name: z.string().trim().min(1).max(80),
        type: z.nativeEnum(TaskPropertyType),
        options: options.optional(),
      },
    },
    async (input) => runMcpTool(() => propertyService.create(input)),
  );
  server.registerTool(
    'update_property',
    {
      title: 'Update a task property',
      description:
        'Update a property definition without invalidating stored task values.',
      inputSchema: {
        id: idSchema,
        name: z.string().trim().min(1).max(80).optional(),
        type: z.nativeEnum(TaskPropertyType).optional(),
        options: options.optional(),
      },
    },
    async (input) => runMcpTool(() => propertyService.update(input)),
  );
  server.registerTool(
    'reorder_properties',
    {
      title: 'Reorder task properties',
      description: 'Set the complete ordered list of property definition ids.',
      inputSchema: {
        propertyIds: z.array(idSchema).max(MAX_TASK_PROPERTIES),
      },
    },
    async (input) =>
      runMcpTool(async () => {
        await propertyService.reorder(input);
        return { reordered: input.propertyIds };
      }),
  );
  server.registerTool(
    'delete_property',
    {
      title: 'Delete a task property',
      description:
        'Delete a property and all of its task values. Confirm with the user first.',
      inputSchema: { id: idSchema },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      runMcpTool(async () => {
        await propertyService.delete(id);
        return { deleted: id };
      }),
  );
  server.registerTool(
    'set_task_property_value',
    {
      title: 'Set a task property value',
      description:
        'Validate and set one task value according to its property definition.',
      inputSchema: { taskId: idSchema, propertyId: idSchema, value },
    },
    async (input) => runMcpTool(() => propertyService.setValue(input)),
  );
  server.registerTool(
    'delete_task_property_value',
    {
      title: 'Delete a task property value',
      description: 'Clear one configured value from a task.',
      inputSchema: { taskId: idSchema, propertyId: idSchema },
      annotations: { destructiveHint: true },
    },
    async ({ taskId, propertyId }) =>
      runMcpTool(async () => {
        await propertyService.deleteValue(taskId, propertyId);
        return { deleted: { taskId, propertyId } };
      }),
  );
}
