import { afterEach, describe, expect, it, vi } from 'vitest';

import { isValidMcpToken } from '@/lib/mcp/auth';

describe('MCP bearer authentication', () => {
  /** Restores the process token after every authentication case. */
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** Proves absent and incorrect credentials are rejected. */
  it('rejects missing and forged bearer tokens', async () => {
    vi.stubEnv('MCP_TOKEN', 'mcp-unit-token');

    await expect(isValidMcpToken(undefined)).resolves.toBe(false);
    await expect(isValidMcpToken('')).resolves.toBe(false);
    await expect(isValidMcpToken('forged-token')).resolves.toBe(false);
  });

  /** Proves the independently configured MCP token is accepted. */
  it('accepts the configured bearer token', async () => {
    vi.stubEnv('MCP_TOKEN', 'mcp-unit-token');

    await expect(isValidMcpToken('mcp-unit-token')).resolves.toBe(true);
  });

  /** Proves a deployment cannot authenticate MCP without explicit configuration. */
  it('fails closed when MCP_TOKEN is absent', async () => {
    vi.stubEnv('MCP_TOKEN', '');

    await expect(isValidMcpToken('candidate')).rejects.toThrow(
      'MCP_TOKEN is required.',
    );
  });
});
