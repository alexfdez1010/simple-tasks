import 'server-only';

/** Returns the configured MCP bearer token or fails during server setup. */
export function getMcpToken(): string {
  const token = process.env.MCP_TOKEN;
  if (!token) throw new Error('MCP_TOKEN is required.');
  return token;
}
