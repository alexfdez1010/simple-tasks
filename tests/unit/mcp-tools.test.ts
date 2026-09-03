import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { registerSimpleTaskTools } from '@/lib/mcp/tools';

const EXPECTED_TOOLS = [
  'create_statistic',
  'create_status',
  'create_task',
  'create_property',
  'delete_property',
  'delete_status',
  'delete_task',
  'delete_task_property_value',
  'delete_statistic',
  'get_statistics',
  'get_task',
  'list_board',
  'list_properties',
  'list_statuses',
  'list_statistics',
  'move_task',
  'reorder_properties',
  'reorder_statuses',
  'reorder_tasks',
  'reorder_statistics',
  'set_task_property_value',
  'update_property',
  'update_status',
  'update_task',
  'update_statistic',
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
    expect(descriptions.delete_statistic).toMatch(/confirm/i);
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

  /** Proves an agent can add a useful default KPI by sending only its name. */
  it('defaults a minimal create_statistic request', () => {
    const registerTool = vi.fn();
    const server = { registerTool } as unknown as McpServer;
    registerSimpleTaskTools(server);
    const definition = registerTool.mock.calls.find(
      ([name]) => name === 'create_statistic',
    )?.[1] as { inputSchema: z.ZodRawShape };
    const result = z.object(definition.inputSchema).parse({ name: 'All work' });

    expect(result).toMatchObject({
      color: 'FOREST',
      dateRange: 'ALL_TIME',
      groupBy: 'NONE',
      measure: 'COUNT',
      scope: 'ALL',
      size: 'AUTO',
      statusIds: [],
      visualization: 'KPI',
    });
  });

  /** Proves agents can configure the same appearance fields as the web editor. */
  it('accepts statistic color and size updates', () => {
    const registerTool = vi.fn();
    const server = { registerTool } as unknown as McpServer;
    registerSimpleTaskTools(server);
    const definition = registerTool.mock.calls.find(
      ([name]) => name === 'update_statistic',
    )?.[1] as { inputSchema: z.ZodRawShape };
    const schema = z.object(definition.inputSchema);

    expect(
      schema.safeParse({ id: 'statistic-1', color: 'CORAL', size: 'FULL' })
        .success,
    ).toBe(true);
    expect(
      schema.safeParse({ id: 'statistic-1', color: '#ff0000', size: 'HUGE' })
        .success,
    ).toBe(false);
  });
});
