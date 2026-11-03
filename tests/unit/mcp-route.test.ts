import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as route from '@/app/api/mcp/[transport]/route';

vi.mock('@/lib/mcp/tools', () => ({ registerSimpleTaskTools: vi.fn() }));
vi.mock('@/lib/auth/server', () => ({
  auth: {},
  mcpResource: 'http://localhost/api/mcp/mcp',
  mcpScopes: ['tasks:read', 'tasks:write'],
}));
vi.mock('@/lib/mcp/auth', () => ({
  hasActiveMcpGrant: vi.fn(async () => true),
}));
vi.mock('@better-auth/mcp', () => ({
  requireMcpAuth:
    (
      _auth: unknown,
      handler: (request: Request, claims: unknown) => Promise<Response>,
    ) =>
    async (request: Request) => {
      if (
        request.headers.get('Authorization') !== 'Bearer mcp-route-test-token'
      )
        return new Response(null, {
          status: 401,
          headers: {
            'WWW-Authenticate':
              'Bearer resource_metadata="http://localhost/.well-known/oauth-protected-resource"',
          },
        });
      return handler(request, {
        sub: 'owner',
        azp: 'client',
        scope: 'tasks:read tasks:write',
      });
    },
}));

const MCP_URL = 'http://localhost/api/mcp/mcp';
const TOKEN = 'mcp-route-test-token';

/** Creates a transport request with optional bearer authentication. */
function createRequest(method: string, token?: string): Request {
  return new Request(MCP_URL, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe('MCP HTTP route', () => {
  /** Uses an isolated credential without reading production configuration. */
  beforeEach(() => {
    vi.stubEnv('MCP_TOKEN', TOKEN);
  });

  /** Restores the caller's environment after each transport check. */
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** Reproduces Next.js delegating HEAD to GET when HEAD is not exported. */
  it('settles authenticated HEAD probes without entering the MCP adapter', async () => {
    const head = Reflect.get(route, 'HEAD') ?? route.GET;
    const response = await head(createRequest('HEAD', TOKEN));

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
    expect(await response.text()).toBe('');
  }, 1_000);

  it('rejects unknown transport paths without entering the adapter', async () => {
    const response = await route.POST(
      new Request('http://localhost/api/mcp/unknown', {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}` },
      }),
    );
    expect(response.status).toBe(404);
  });

  /** Prevents the adapter's configuration being mistaken for Vercel's limit. */
  it('exports the platform execution limit', () => {
    expect(Reflect.get(route, 'maxDuration')).toBe(60);
  });

  /** Keeps unsupported transport methods behind the existing bearer check. */
  it.each(['HEAD', 'GET', 'DELETE', 'POST'])(
    'rejects missing and forged credentials for %s',
    async (method) => {
      const handler = Reflect.get(route, method) ?? route.GET;
      for (const token of [undefined, 'forged-token']) {
        const response = await handler(createRequest(method, token));
        expect(response.status).toBe(401);
        expect(response.headers.get('WWW-Authenticate')).toContain('Bearer');
      }
    },
  );

  /** Preserves immediate method rejection for authenticated GET and DELETE. */
  it.each(['GET', 'DELETE'])('keeps %s unsupported', async (method) => {
    const response = await Reflect.get(
      route,
      method,
    )(createRequest(method, TOKEN));
    expect(response.status).toBe(405);
  });

  /** Exercises the actual MCP adapter's initialization and notification paths. */
  it('still initializes MCP and accepts notifications through POST', async () => {
    for (const [payload, expectedStatus] of [
      [
        {
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: { name: 'route-test', version: '1.0.0' },
          },
        },
        200,
      ],
      [{ method: 'notifications/initialized' }, 202],
    ] as const) {
      const response = await route.POST(
        new Request(MCP_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            Accept: 'application/json, text/event-stream',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jsonrpc: '2.0', ...payload }),
        }),
      );
      expect(response.status).toBe(expectedStatus);
      const body = await response.text();
      if (expectedStatus === 200) expect(body).toContain('simple-tasks');
    }
  });
});
