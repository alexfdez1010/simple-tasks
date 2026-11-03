import { createHash, randomBytes } from 'node:crypto';
import { expect, request, type APIRequestContext } from '@playwright/test';
import { loginRequest } from './auth-fixture';

export const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
export const SCOPES = ['tasks:read', 'tasks:write', 'offline_access'];

/** Registers a native test client and constructs a real S256 authorization request. */
export async function beginOAuth(context: APIRequestContext, scopes = SCOPES) {
  const registration = await context.post('/api/auth/oauth2/register', {
    data: {
      client_name: `MCP permissions ${randomBytes(4).toString('hex')}`,
      application_type: 'native',
      redirect_uris: ['http://127.0.0.1:4545/callback'],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      scope: scopes.join(' '),
    },
  });
  const client = await registration.json();
  expect(registration.status(), JSON.stringify(client)).toBe(201);
  const verifier = randomBytes(32).toString('base64url');
  const query = new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: 'http://127.0.0.1:4545/callback',
    response_type: 'code',
    state: 'test-state',
    scope: scopes.join(' '),
    resource: `${BASE_URL}/api/mcp/mcp`,
    code_challenge_method: 'S256',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
  });
  return {
    clientId: client.client_id as string,
    name: client.client_name as string,
    verifier,
    url: `${BASE_URL}/api/auth/oauth2/authorize?${query}`,
  };
}

/** Exchanges an authorization code, preserving its client, verifier and resource binding. */
export async function exchangeCode(
  context: APIRequestContext,
  flow: Awaited<ReturnType<typeof beginOAuth>>,
  code: string,
) {
  return context.post('/api/auth/oauth2/token', {
    form: {
      client_id: flow.clientId,
      redirect_uri: 'http://127.0.0.1:4545/callback',
      grant_type: 'authorization_code',
      code,
      code_verifier: flow.verifier,
      resource: `${BASE_URL}/api/mcp/mcp`,
    },
  });
}

/** Obtains a token through two factors, explicit consent and a one-use authorization code. */
export async function createOAuthToken(scopes = SCOPES) {
  const context = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Origin: BASE_URL },
  });
  try {
    await loginRequest(context);
    const flow = await beginOAuth(context, scopes);
    const authorize = await context.get(flow.url, { maxRedirects: 0 });
    const consentUrl = new URL(authorize.headers().location, BASE_URL);
    expect(consentUrl.pathname).toBe('/oauth/consent');
    const consent = await context.post('/api/auth/oauth2/consent', {
      data: {
        accept: true,
        scope: scopes.join(' '),
        oauth_query: consentUrl.search.slice(1),
      },
    });
    const consentData = await consent.json();
    expect(consent.ok(), JSON.stringify(consentData)).toBe(true);
    const code = new URL(consentData.url).searchParams.get('code')!;
    const exchange = await exchangeCode(context, flow, code);
    const tokens = await exchange.json();
    expect(exchange.ok()).toBe(true);
    return { ...tokens, clientId: flow.clientId } as {
      access_token: string;
      refresh_token: string;
      clientId: string;
    };
  } finally {
    await context.dispose();
  }
}
