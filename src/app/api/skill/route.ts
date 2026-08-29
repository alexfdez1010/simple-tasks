import { getPublicOrigin } from 'mcp-handler';
import type { NextRequest } from 'next/server';

import {
  buildMcpConfig,
  buildSkillMarkdown,
  MCP_CONFIG_FILENAME,
  SKILL_FILENAME,
} from '@/lib/mcp/skill';

/** Downloads either the agent skill or the remote MCP configuration. */
export function GET(request: NextRequest): Response {
  const serverUrl = `${getPublicOrigin(request)}/api/mcp/mcp`;
  const isConfig = request.nextUrl.searchParams.get('kind') === 'config';
  const content = isConfig
    ? buildMcpConfig(serverUrl)
    : buildSkillMarkdown(serverUrl);
  const filename = isConfig ? MCP_CONFIG_FILENAME : SKILL_FILENAME;
  return new Response(content, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': isConfig
        ? 'application/json; charset=utf-8'
        : 'text/markdown; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
