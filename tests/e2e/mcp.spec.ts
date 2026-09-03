import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { expect, request, test } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const MCP_TOKEN = process.env.MCP_TOKEN ?? 'dev-mcp-token';
const MCP_URL = new URL('/api/mcp/mcp', BASE_URL);
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

/** Connects an official MCP client with the configured bearer credential. */
async function connectMcp(token = MCP_TOKEN): Promise<{
  client: Client;
  transport: StreamableHTTPClientTransport;
}> {
  const transport = new StreamableHTTPClientTransport(MCP_URL, {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });
  const client = new Client({ name: 'simple-tasks-e2e', version: '1.0.0' });
  await client.connect(transport);
  return { client, transport };
}

/** Extracts the JSON payload from a standard MCP text tool result. */
function parseToolJson<T>(result: unknown): T {
  const content = (
    result as { content?: Array<{ text?: string; type: string }> }
  ).content;
  const text = content?.find((item) => item.type === 'text')?.text;
  expect(text, 'The MCP tool did not return text content.').toBeTruthy();
  return JSON.parse(text!) as T;
}

test.describe('remote MCP server', () => {
  /** Proves missing and forged bearer credentials are rejected at transport entry. */
  test('returns 401 for unauthenticated requests', async () => {
    const context = await request.newContext({ baseURL: BASE_URL });
    try {
      const payload = {
        data: { id: 1, jsonrpc: '2.0', method: 'tools/list', params: {} },
        headers: {
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
        },
      };
      expect((await context.post('/api/mcp/mcp', payload)).status()).toBe(401);
      expect(
        (
          await context.post('/api/mcp/mcp', {
            ...payload,
            headers: { ...payload.headers, Authorization: 'Bearer forged' },
          })
        ).status(),
      ).toBe(401);
    } finally {
      await context.dispose();
    }
  });

  /** Proves authenticated discovery returns the complete stable tool catalog. */
  test('lists every task, status, property, and statistic tool', async () => {
    const { client, transport } = await connectMcp();
    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name).sort()).toEqual(
        [...EXPECTED_TOOLS].sort(),
      );
    } finally {
      await transport.close();
    }
  });

  /** Proves task, status, and property operations compose through the real transport. */
  test('executes task, status, and property CRUD', async () => {
    const { client, transport } = await connectMcp();
    const suffix = process.pid.toString();
    let sourceStatusId: string | undefined;
    let terminalStatusId: string | undefined;
    let taskId: string | undefined;
    const propertyIds: string[] = [];
    try {
      const existing = parseToolJson<Array<{ id: string }>>(
        await client.callTool({ name: 'list_statuses', arguments: {} }),
      );
      if (existing.length === 0) {
        await client.callTool({
          name: 'create_status',
          arguments: {
            color: '#64748B',
            isTerminal: false,
            name: `E2E Base ${suffix}`,
          },
        });
      }

      const source = parseToolJson<{ color: string; id: string; name: string }>(
        await client.callTool({
          name: 'create_status',
          arguments: {
            color: '#334155',
            isTerminal: false,
            name: `E2E MCP Source ${suffix}`,
          },
        }),
      );
      sourceStatusId = source.id;
      const terminal = parseToolJson<{ id: string; isTerminal: boolean }>(
        await client.callTool({
          name: 'create_status',
          arguments: {
            color: '#16A34A',
            isTerminal: true,
            name: `E2E MCP Done ${suffix}`,
          },
        }),
      );
      terminalStatusId = terminal.id;

      const created = parseToolJson<{ id: string; title: string }>(
        await client.callTool({
          name: 'create_task',
          arguments: {
            description: '**MCP** description',
            dueDate: '2026-09-05T00:00:00.000Z',
            statusId: source.id,
            title: `E2E MCP Task ${suffix}`,
          },
        }),
      );
      taskId = created.id;
      expect(created.title).toBe(`E2E MCP Task ${suffix}`);

      const updated = parseToolJson<{ description: string; title: string }>(
        await client.callTool({
          name: 'update_task',
          arguments: {
            description: 'Updated through MCP',
            id: created.id,
            title: `E2E MCP Updated ${suffix}`,
          },
        }),
      );
      expect(updated).toMatchObject({
        description: 'Updated through MCP',
        title: `E2E MCP Updated ${suffix}`,
      });

      const priority = parseToolJson<{
        id: string;
        options: string[];
        type: string;
      }>(
        await client.callTool({
          name: 'create_property',
          arguments: {
            name: `E2E MCP Priority ${suffix}`,
            options: ['High', 'Medium', 'Low'],
            type: 'SELECT',
          },
        }),
      );
      propertyIds.push(priority.id);
      const labels = parseToolJson<{ id: string }>(
        await client.callTool({
          name: 'create_property',
          arguments: {
            name: `E2E MCP Labels ${suffix}`,
            options: ['Frontend', 'Backend', 'Infra'],
            type: 'MULTI_SELECT',
          },
        }),
      );
      propertyIds.push(labels.id);

      expect(
        parseToolJson<{ propertyId: string; value: string }>(
          await client.callTool({
            name: 'set_task_property_value',
            arguments: {
              propertyId: priority.id,
              taskId: created.id,
              value: 'High',
            },
          }),
        ),
      ).toEqual({ propertyId: priority.id, value: 'High' });
      await client.callTool({
        name: 'set_task_property_value',
        arguments: {
          propertyId: labels.id,
          taskId: created.id,
          value: ['Infra', 'Frontend'],
        },
      });
      const properties = parseToolJson<Array<{ id: string }>>(
        await client.callTool({ name: 'list_properties', arguments: {} }),
      );
      expect(properties.map(({ id }) => id)).toEqual(
        expect.arrayContaining([priority.id, labels.id]),
      );
      await client.callTool({
        name: 'reorder_properties',
        arguments: { propertyIds: properties.map(({ id }) => id).reverse() },
      });
      const renamed = parseToolJson<{ name: string; options: string[] }>(
        await client.callTool({
          name: 'update_property',
          arguments: {
            id: priority.id,
            name: `E2E MCP Priority Updated ${suffix}`,
            options: ['High', 'Medium', 'Low', 'Critical'],
          },
        }),
      );
      expect(renamed).toMatchObject({
        name: `E2E MCP Priority Updated ${suffix}`,
        options: ['High', 'Medium', 'Low', 'Critical'],
      });

      const moved = parseToolJson<{
        completedAt: string;
        statusId: string;
      }>(
        await client.callTool({
          name: 'move_task',
          arguments: { id: created.id, index: 0, statusId: terminal.id },
        }),
      );
      expect(moved.statusId).toBe(terminal.id);
      expect(moved.completedAt).toBeTruthy();

      const fetched = parseToolJson<{
        id: string;
        propertyValues: Array<{ propertyId: string; value: unknown }>;
        status: { id: string };
      }>(
        await client.callTool({
          name: 'get_task',
          arguments: { id: created.id },
        }),
      );
      expect(fetched).toMatchObject({
        id: created.id,
        status: { id: terminal.id },
      });
      expect(fetched.propertyValues).toEqual(
        expect.arrayContaining([
          { propertyId: priority.id, value: 'High' },
          { propertyId: labels.id, value: ['Infra', 'Frontend'] },
        ]),
      );
      expect(
        parseToolJson<{ deleted: { propertyId: string; taskId: string } }>(
          await client.callTool({
            name: 'delete_task_property_value',
            arguments: { propertyId: labels.id, taskId: created.id },
          }),
        ),
      ).toEqual({
        deleted: { propertyId: labels.id, taskId: created.id },
      });

      for (const propertyId of [...propertyIds].reverse()) {
        await client.callTool({
          name: 'delete_property',
          arguments: { id: propertyId },
        });
        propertyIds.splice(propertyIds.indexOf(propertyId), 1);
      }

      expect(
        parseToolJson<{ deleted: string }>(
          await client.callTool({
            name: 'delete_task',
            arguments: { id: created.id },
          }),
        ),
      ).toEqual({ deleted: created.id });
      taskId = undefined;
      await client.callTool({
        name: 'delete_status',
        arguments: { id: source.id },
      });
      sourceStatusId = undefined;
      await client.callTool({
        name: 'delete_status',
        arguments: { id: terminal.id },
      });
      terminalStatusId = undefined;
    } finally {
      if (taskId) {
        await client.callTool({
          name: 'delete_task',
          arguments: { id: taskId },
        });
      }
      for (const propertyId of [...propertyIds].reverse()) {
        await client.callTool({
          name: 'delete_property',
          arguments: { id: propertyId },
        });
      }
      if (sourceStatusId) {
        await client.callTool({
          name: 'delete_status',
          arguments: { id: sourceStatusId },
        });
      }
      if (terminalStatusId) {
        await client.callTool({
          name: 'delete_status',
          arguments: { id: terminalStatusId },
        });
      }
      await transport.close();
    }
  });

  /** Proves agents can create, calculate, update, reorder, and delete statistics. */
  test('executes configurable statistic CRUD', async () => {
    const { client, transport } = await connectMcp();
    let statisticId: string | undefined;
    try {
      const initial = parseToolJson<Array<{ id: string }>>(
        await client.callTool({ name: 'list_statistics', arguments: {} }),
      );
      const created = parseToolJson<{ id: string; name: string }>(
        await client.callTool({
          name: 'create_statistic',
          arguments: {
            dateBucket: null,
            dateField: null,
            datePropertyId: null,
            dateRange: 'ALL_TIME',
            groupBy: 'NONE',
            groupPropertyId: null,
            measure: 'COUNT',
            measurePropertyId: null,
            name: `E2E MCP Statistic ${process.pid}`,
            scope: 'ALL',
            statusIds: [],
            visualization: 'KPI',
          },
        }),
      );
      statisticId = created.id;
      const updated = parseToolJson<{
        dateField: string;
        dateRange: string;
        name: string;
        scope: string;
      }>(
        await client.callTool({
          name: 'update_statistic',
          arguments: {
            id: created.id,
            dateField: 'COMPLETED_AT',
            dateRange: 'LAST_30_DAYS',
            name: `E2E MCP Statistic Updated ${process.pid}`,
            scope: 'COMPLETED',
          },
        }),
      );
      expect(updated.scope).toBe('COMPLETED');
      expect(updated.dateRange).toBe('LAST_30_DAYS');
      expect(updated.dateField).toBe('COMPLETED_AT');

      const calculated = parseToolJson<{
        statistics: Array<{
          definition: { id: string };
          result: { kind: string };
        }>;
      }>(await client.callTool({ name: 'get_statistics', arguments: {} }));
      expect(calculated.statistics).toContainEqual(
        expect.objectContaining({
          definition: expect.objectContaining({ id: created.id }),
          result: expect.objectContaining({ kind: 'KPI' }),
        }),
      );
      const order = [...initial.map(({ id }) => id), created.id];
      await client.callTool({
        name: 'reorder_statistics',
        arguments: { statisticIds: [...order].reverse() },
      });
      await client.callTool({
        name: 'reorder_statistics',
        arguments: { statisticIds: order },
      });
      expect(
        parseToolJson<{ deleted: string }>(
          await client.callTool({
            name: 'delete_statistic',
            arguments: { id: created.id },
          }),
        ),
      ).toEqual({ deleted: created.id });
      statisticId = undefined;
    } finally {
      if (statisticId) {
        await client.callTool({
          name: 'delete_statistic',
          arguments: { id: statisticId },
        });
      }
      await transport.close();
    }
  });
});
