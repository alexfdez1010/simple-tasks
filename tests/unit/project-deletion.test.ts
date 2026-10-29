import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PrismaClient } from '@/generated/prisma';
import { describe, expect, it, vi } from 'vitest';
import { coordinationService } from '@/lib/coordination';
import type { CoordinationRepository } from '@/lib/coordination/repository';
import { CoordinationService } from '@/lib/coordination/service';
import { deleteProjectAndMoveTasks } from '@/lib/coordination/project-deletion';
import { getOpenApiDocument } from '@/lib/api/openapi';
import { registerCoordinationTools } from '@/lib/mcp/coordination-tools';
import { conflict } from '@/lib/validation/errors';

describe('project deletion boundaries', () => {
  /** Proves invalid/self/unknown fields never reach persistence and normalized inputs retain the destination. */
  it('validates the deletion contract before delegation', async () => {
    const deleteProject = vi.fn().mockResolvedValue(undefined);
    const service = new CoordinationService({
      deleteProject,
    } as unknown as CoordinationRepository);
    for (const input of [
      { id: ' ' },
      { id: 'x'.repeat(192) },
      { id: 'same', destinationProjectId: 'same' },
      { id: 'source', extra: true },
    ])
      expect(() => service.deleteProject(input)).toThrow();
    expect(deleteProject).not.toHaveBeenCalled();
    await service.deleteProject({
      id: ' source ',
      destinationProjectId: ' target ',
    });
    expect(deleteProject).toHaveBeenCalledExactlyOnceWith({
      id: 'source',
      destinationProjectId: 'target',
    });
  });

  /** Proves a damaged legacy installation cannot remove its sole nondefault project. */
  it('protects the last project even when the legacy default is missing', async () => {
    const remove = vi.fn();
    const transaction = {
      project: {
        findUnique: vi.fn().mockResolvedValue({ id: 'only' }),
        count: vi.fn().mockResolvedValue(1),
        delete: remove,
      },
    };
    const client = {
      $transaction: vi.fn(async (operation) => operation(transaction)),
    } as unknown as PrismaClient;
    await expect(
      deleteProjectAndMoveTasks(client, { id: 'only' }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Keep at least one project.',
    });
    expect(remove).not.toHaveBeenCalled();
  });

  /** Proves the advertised MCP handler shares validation/error semantics and marks the operation as destructive. */
  it('advertises and executes the shared service from MCP', async () => {
    const registerTool = vi.fn();
    registerCoordinationTools({ registerTool } as unknown as McpServer);
    const [, definition, execute] = registerTool.mock.calls.find(
      ([name]) => name === 'delete_project',
    )!;
    expect(definition.annotations).toMatchObject({ destructiveHint: true });
    const deletion = vi
      .spyOn(coordinationService, 'deleteProject')
      .mockResolvedValue(undefined);
    expect(
      await execute({ id: 'source', destinationProjectId: 'target' }),
    ).toMatchObject({
      content: [
        { type: 'text', text: JSON.stringify({ deleted: 'source' }, null, 2) },
      ],
    });
    expect(deletion).toHaveBeenCalledWith({
      id: 'source',
      destinationProjectId: 'target',
    });
    deletion.mockRejectedValue(conflict('Choose a destination project.'));
    expect(await execute({ id: 'source' })).toMatchObject({
      isError: true,
      content: [{ text: 'Choose a destination project.' }],
    });
  });

  /** Proves clients discover the optional JSON transfer body and its successful empty response. */
  it('documents DELETE JSON only for endpoints accepting it', () => {
    const paths = getOpenApiDocument().paths;
    expect(paths['/projects/{id}'].delete).toMatchObject({
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              properties: { destinationProjectId: { type: 'string' } },
              additionalProperties: false,
            },
          },
        },
      },
      responses: { 204: {} },
    });
    expect(paths['/assignees/{id}'].delete).not.toHaveProperty('requestBody');
  });
});
