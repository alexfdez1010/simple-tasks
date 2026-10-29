import { createMcpHandler, withMcpAuth } from 'mcp-handler';

import { isValidMcpToken } from '@/lib/mcp/auth';
import { registerSimpleTaskTools } from '@/lib/mcp/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const handler = createMcpHandler(
  (server) => registerSimpleTaskTools(server),
  { serverInfo: { name: 'simple-tasks', version: '1.0.0' } },
  { basePath: '/api/mcp', maxDuration: 60, disableSse: true },
);

/**
 * Handles authenticated transport requests without leaving HEAD probes pending.
 * @param request - The bearer-validated HTTP request.
 * @returns An empty 405 for HEAD, otherwise the adapter response and tool effects.
 */
function handleMcpRequest(request: Request): Response | Promise<Response> {
  if (request.method === 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  }
  return handler(request);
}

const authenticatedHandler = withMcpAuth(
  handleMcpRequest,
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
  authenticatedHandler as HEAD,
  authenticatedHandler as POST,
};
