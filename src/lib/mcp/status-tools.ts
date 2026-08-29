import 'server-only';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { runMcpTool } from '@/lib/mcp/shared';
import { statusService } from '@/lib/statuses';
import { colorSchema, idSchema } from '@/lib/validation/common';

const id = idSchema;
const color = colorSchema;

/** Registers every MCP status query and mutation against the shared status service. */
export function registerStatusTools(server: McpServer): void {
  server.registerTool(
    'list_statuses',
    {
      title: 'List statuses',
      description: 'Return all configured Kanban statuses in board order.',
      inputSchema: {},
    },
    async () => runMcpTool(() => statusService.list()),
  );
  server.registerTool(
    'create_status',
    {
      title: 'Create a status',
      description: 'Append a customizable status to the board.',
      inputSchema: {
        name: z.string().trim().min(1).max(60),
        color,
        isTerminal: z.boolean().optional(),
      },
    },
    async ({ name, color: statusColor, isTerminal }) =>
      runMcpTool(() =>
        statusService.create({
          name,
          color: statusColor,
          isTerminal: isTerminal ?? false,
        }),
      ),
  );
  server.registerTool(
    'update_status',
    {
      title: 'Update a status',
      description:
        'Update status name, color, or terminal behavior. Omitted fields remain unchanged.',
      inputSchema: {
        id,
        name: z.string().trim().min(1).max(60).optional(),
        color: color.optional(),
        isTerminal: z.boolean().optional(),
      },
    },
    async (input) => runMcpTool(() => statusService.update(input)),
  );
  server.registerTool(
    'reorder_statuses',
    {
      title: 'Reorder statuses',
      description:
        'Set the complete board order. statusIds must contain every status exactly once.',
      inputSchema: { statusIds: z.array(id).min(1) },
    },
    async (input) =>
      runMcpTool(async () => {
        await statusService.reorder(input);
        return { reordered: input.statusIds };
      }),
  );
  server.registerTool(
    'delete_status',
    {
      title: 'Delete a status',
      description:
        'Delete an empty status. At least one status must remain. Confirm with the user first.',
      inputSchema: { id },
    },
    async ({ id: statusId }) =>
      runMcpTool(async () => {
        await statusService.delete(statusId);
        return { deleted: statusId };
      }),
  );
}
