import { getErrorMessage } from '@/lib/validation/errors';

export type McpTextResult = {
  content: [{ type: 'text'; text: string }];
  isError?: true;
};

/** Wraps serializable data in a standard MCP text result. */
export function ok(data: unknown): McpTextResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

/** Executes an MCP use case without exposing infrastructure error details. */
export async function runMcpTool(
  operation: () => Promise<unknown>,
): Promise<McpTextResult> {
  try {
    return ok(await operation());
  } catch (error) {
    return {
      content: [{ type: 'text', text: getErrorMessage(error) }],
      isError: true,
    };
  }
}
