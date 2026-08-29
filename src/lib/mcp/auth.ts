import 'server-only';

import { timingSafeMatch } from '@/lib/auth/token';

/** Reads the independently configured MCP bearer token. */
function getExpectedMcpToken(): string {
  const token = process.env.MCP_TOKEN;
  if (!token) throw new Error('MCP_TOKEN is required.');
  return token;
}

/** Validates a bearer token through fixed-length digest comparison. */
export async function isValidMcpToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  return timingSafeMatch(token, getExpectedMcpToken(), 'simple-tasks:mcp:v1');
}
