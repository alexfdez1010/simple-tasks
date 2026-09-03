import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerPropertyTools } from '@/lib/mcp/property-tools';
import { registerStatisticTools } from '@/lib/mcp/statistic-tools';
import { registerStatusTools } from '@/lib/mcp/status-tools';
import { registerTaskTools } from '@/lib/mcp/task-tools';

/** Registers the complete Simple Tasks capability surface on an MCP server. */
export function registerSimpleTaskTools(server: McpServer): void {
  registerTaskTools(server);
  registerStatusTools(server);
  registerPropertyTools(server);
  registerStatisticTools(server);
}
