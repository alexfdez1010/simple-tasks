import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it, vi } from 'vitest';
import { coordinationService } from '@/lib/coordination';
import type { CoordinationRepository } from '@/lib/coordination/repository';
import { CoordinationService } from '@/lib/coordination/service';
import { registerCoordinationTools } from '@/lib/mcp/coordination-tools';
import { conflict } from '@/lib/validation/errors';

describe('responsible-party deletion boundaries', () => {
  /** Proves malformed IDs cannot reach persistence and valid IDs are normalized. */
  it('validates identifiers before delegating to the injected repository', async () => {
    const deleteAssignee = vi.fn().mockResolvedValue(undefined);
    const service = new CoordinationService({
      deleteAssignee,
    } as unknown as CoordinationRepository);
    expect(() => service.deleteAssignee({ id: ' ' })).toThrow();
    expect(() => service.deleteAssignee({ id: 'x'.repeat(192) })).toThrow();
    expect(deleteAssignee).not.toHaveBeenCalled();
    await service.deleteAssignee({ id: ' owner-id ' });
    expect(deleteAssignee).toHaveBeenCalledExactlyOnceWith('owner-id');
  });

  /** Proves MCP returns a deletion receipt and a safe domain conflict without leaking details. */
  it('executes the shared service through the advertised MCP handler', async () => {
    const registerTool = vi.fn();
    registerCoordinationTools({ registerTool } as unknown as McpServer);
    const [, definition, execute] = registerTool.mock.calls.find(
      ([name]) => name === 'delete_assignee',
    )!;
    expect(definition.annotations).toMatchObject({ destructiveHint: true });
    const deletion = vi
      .spyOn(coordinationService, 'deleteAssignee')
      .mockResolvedValue(undefined);
    expect(await execute({ id: 'unused' })).toEqual({
      content: [
        { type: 'text', text: JSON.stringify({ deleted: 'unused' }, null, 2) },
      ],
    });
    expect(deletion).toHaveBeenCalledWith({ id: 'unused' });
    deletion.mockRejectedValue(
      conflict('The default responsible party cannot be deleted.'),
    );
    expect(await execute({ id: 'assignee-default' })).toMatchObject({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'The default responsible party cannot be deleted.',
        },
      ],
    });
  });
});
