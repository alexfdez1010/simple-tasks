import 'server-only';

import { timingSafeMatch } from '@/lib/auth/token';
import { getMcpToken } from '@/lib/mcp/config';

/** Validates a bearer token through fixed-length digest comparison. */
export async function isValidMcpToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  return timingSafeMatch(token, getMcpToken(), 'simple-tasks:mcp:v1');
}
