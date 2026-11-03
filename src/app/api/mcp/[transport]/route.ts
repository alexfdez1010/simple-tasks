import { createMcpHandler } from 'mcp-handler';
import { requireMcpAuth } from '@better-auth/mcp';
import { auth, mcpResource, mcpScopes } from '@/lib/auth/server';
import { hasActiveMcpGrant } from '@/lib/mcp/auth';
import { scopedMcpServer } from '@/lib/mcp/permissions';
import { registerSimpleTaskTools } from '@/lib/mcp/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const authenticatedHandler = requireMcpAuth(
  auth,
  async (request, claims) => {
    const scopes =
      typeof claims.scope === 'string' ? claims.scope.split(' ') : [];
    if (
      typeof claims.sub !== 'string' ||
      typeof claims.azp !== 'string' ||
      !(await hasActiveMcpGrant(claims.sub, claims.azp, scopes))
    ) {
      return Response.json(
        { error: 'invalid_token' },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': `Bearer resource_metadata="${new URL(mcpResource).origin}/.well-known/oauth-protected-resource/api/mcp/mcp"`,
          },
        },
      );
    }
    if (new URL(request.url).pathname !== '/api/mcp/mcp')
      return new Response(null, { status: 404 });
    if (request.method !== 'POST')
      return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    const handler = createMcpHandler(
      (server) => registerSimpleTaskTools(scopedMcpServer(server, scopes)),
      { serverInfo: { name: 'simple-tasks', version: '2.0.0' } },
      { basePath: '/api/mcp', maxDuration: 60, disableSse: true },
    );
    return handler(request);
  },
  {
    resource: mcpResource,
    requiredScopes: ['tasks:read'],
    challengeScopes: mcpScopes,
  },
);

export {
  authenticatedHandler as DELETE,
  authenticatedHandler as GET,
  authenticatedHandler as HEAD,
  authenticatedHandler as POST,
};
