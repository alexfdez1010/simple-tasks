import { createMcpHandler, withMcpAuth } from 'mcp-handler';

import { isValidMcpToken } from '@/lib/mcp/auth';
import { registerSimpleTaskTools } from '@/lib/mcp/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = createMcpHandler(
  (server) => registerSimpleTaskTools(server),
  { serverInfo: { name: 'simple-tasks', version: '1.0.0' } },
  { basePath: '/api/mcp', maxDuration: 60, disableSse: true },
);

const authenticatedHandler = withMcpAuth(
  handler,
  async (_request, bearerToken) => {
    if (!(await isValidMcpToken(bearerToken))) return undefined;
    return {
      token: bearerToken!,
      scopes: ['tasks:read', 'tasks:write'],
      clientId: 'simple-tasks',
    };
  },
  { required: true },
);

export {
  authenticatedHandler as DELETE,
  authenticatedHandler as GET,
  authenticatedHandler as POST,
};
