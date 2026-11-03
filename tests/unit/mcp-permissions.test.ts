import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it, vi } from 'vitest';
import { registerSimpleTaskTools } from '@/lib/mcp/tools';
import {
  scopedMcpServer,
  consentScopes,
  READ_TOOLS,
} from '@/lib/mcp/permissions';

describe('MCP scope enforcement', () => {
  it('registers only the explicit read allowlist for read-only connections', () => {
    const registerTool = vi.fn();
    registerSimpleTaskTools(
      scopedMcpServer({ registerTool } as unknown as McpServer, ['tasks:read']),
    );
    expect(registerTool.mock.calls.map(([name]) => name).sort()).toEqual(
      [...READ_TOOLS].sort(),
    );
  });
  it('allows mutations only with the write scope and fails closed for future tools', () => {
    const registerTool = vi.fn();
    const server = { registerTool } as unknown as McpServer;
    scopedMcpServer(server, ['tasks:read']).registerTool(
      'new_unknown_tool',
      {},
      async () => ({ content: [] }),
    );
    expect(registerTool).not.toHaveBeenCalled();
    registerSimpleTaskTools(
      scopedMcpServer(server, ['tasks:read', 'tasks:write']),
    );
    expect(
      registerTool.mock.calls.some(([name]) => name === 'create_task'),
    ).toBe(true);
  });
  it('never escalates consent beyond the requested scopes', () => {
    expect(
      consentScopes(['tasks:read', 'offline_access', 'tasks:write'], false),
    ).toEqual(['tasks:read', 'offline_access']);
    expect(consentScopes(['tasks:read'], true)).toEqual(['tasks:read']);
  });
});
