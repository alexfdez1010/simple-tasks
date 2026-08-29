import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { registerSimpleTaskTools } from '@/lib/mcp/tools';

const EXPECTED_TOOLS = [
  'create_status',
  'create_task',
  'create_property',
  'delete_property',
  'delete_status',
  'delete_task',
  'delete_task_property_value',
  'get_task',
  'list_board',
  'list_properties',
  'list_statuses',
  'move_task',
  'reorder_properties',
  'reorder_statuses',
  'reorder_tasks',
  'set_task_property_value',
  'update_property',
  'update_status',
  'update_task',
];

describe('MCP tool catalog', () => {
  /** Proves the server exposes the complete documented task and status surface. */
  it('registers every query and mutation exactly once', () => {
    const registerTool = vi.fn();
    const server = { registerTool } as unknown as McpServer;

    registerSimpleTaskTools(server);

    expect(registerTool).toHaveBeenCalledTimes(EXPECTED_TOOLS.length);
    expect(registerTool.mock.calls.map(([name]) => name).sort()).toEqual(
      [...EXPECTED_TOOLS].sort(),
    );
  });

  /** Proves destructive operations advertise their confirmation requirement. */
  it('marks task and status deletion as confirm-first operations', () => {
    const registerTool = vi.fn();
    const server = { registerTool } as unknown as McpServer;

    registerSimpleTaskTools(server);

    const descriptions = Object.fromEntries(
      registerTool.mock.calls.map(([name, definition]) => [
        name,
        definition.description,
      ]),
    );
    expect(descriptions.delete_task).toMatch(/confirm/i);
    expect(descriptions.delete_status).toMatch(/confirm/i);
    expect(descriptions.delete_property).toMatch(/confirm/i);
  });

  /** Proves MCP exposes atomic task movement fields with bounded input validation. */
  it('accepts status and index in the update_task input schema', () => {
    const registerTool = vi.fn();
    const server = { registerTool } as unknown as McpServer;

    registerSimpleTaskTools(server);

    const definition = registerTool.mock.calls.find(
      ([name]) => name === 'update_task',
    )?.[1] as { inputSchema: z.ZodRawShape };
    const schema = z.object(definition.inputSchema);
    expect(
      schema.safeParse({ id: 'task-1', index: 0, statusId: 'done' }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ id: 'task-1', index: -1, statusId: 'done' }).success,
    ).toBe(false);
  });
});
