import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const READ_TOOLS = new Set([
  'list_board',
  'get_task',
  'list_statuses',
  'list_properties',
  'get_statistics',
  'list_statistics',
  'list_assignees',
  'list_projects',
  'list_ready_tasks',
  'search_tasks',
  'list_pending_reviews',
]);

/** Decorates tool registration with a deny-by-default, per-request scope policy. */
export function scopedMcpServer(
  server: McpServer,
  scopes: readonly string[],
): McpServer {
  return new Proxy(server, {
    /** Hides mutations from read clients, including direct calls to unlisted tools. */
    get(target, property, receiver) {
      if (property !== 'registerTool')
        return Reflect.get(target, property, receiver);
      return (...args: Parameters<McpServer['registerTool']>) => {
        if (!READ_TOOLS.has(args[0]) && !scopes.includes('tasks:write')) return;
        return Reflect.apply(target.registerTool, target, args);
      };
    },
  });
}

/** Reduces a signed request to the chosen mode; never grants unrequested scopes. */
export function consentScopes(
  requested: string[],
  fullAccess: boolean,
): string[] {
  return requested.filter((scope) => scope !== 'tasks:write' || fullAccess);
}
