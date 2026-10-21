import { describe, expect, it } from 'vitest';
import { generateApiToken, hashApiToken } from '@/lib/api-tokens/crypto';
import {
  taskCreate,
  taskUpdate,
  taskQuery,
  tasksReorder,
  statusesReorder,
  propertiesReorder,
} from '@/lib/api/schemas';
import { decodeCursor } from '@/lib/api/pagination';
import { matchEndpoints, endpoints } from '@/lib/api/endpoints';
import { spanishEndpointSummaries } from '@/components/api-access/endpoint-summaries';
import { getOpenApiDocument } from '@/lib/api/openapi';

/** Covers secret entropy/metadata, strict API inputs, stable cursor parsing and contract completeness. */
describe('REST API contract', () => {
  it('generates unique 256-bit secrets with only a hash and identifying hint for storage', () => {
    const first = generateApiToken(),
      second = generateApiToken();
    expect(first.token).toMatch(/^st_[A-Za-z0-9_-]{43}$/);
    expect(first.tokenHash).toBe(hashApiToken(first.token));
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.hint).toBe(
      `${first.token.slice(0, 11)}…${first.token.slice(-4)}`,
    );
    expect(first.hint).not.toContain(first.token);
    expect(first.token).not.toBe(second.token);
  });
  it('rejects unknown fields, invalid dates and incomplete moves', () => {
    for (const dueDate of [
      'tomorrow',
      '2026-13-40T12:00:00Z',
      '2026-10-21',
      '2026-10-21T12:00:00+99:99',
    ])
      expect(taskCreate.safeParse({ title: 'Task', dueDate }).success).toBe(
        false,
      );
    expect(taskCreate.safeParse({ title: 'Task', admin: true }).success).toBe(
      false,
    );
    expect(
      taskCreate.parse({
        title: ' Task ',
        dueDate: '2026-10-21T10:00:00+02:00',
      }).title,
    ).toBe('Task');
    expect(taskUpdate.safeParse({ statusId: 'done' }).success).toBe(false);
    expect(taskUpdate.safeParse({ statusId: 'done', index: 0 }).success).toBe(
      true,
    );
    expect(taskQuery.safeParse({ limit: '101' }).success).toBe(false);
    expect(taskQuery.parse({})).toEqual({ limit: 50, scope: 'all' });
  });
  it('rejects extra nested fields, duplicate order ids and covers all Spanish endpoint descriptions', () => {
    expect(
      taskCreate.safeParse({
        title: 'x',
        propertyValues: [{ propertyId: 'id', value: 'x', extra: true }],
      }).success,
    ).toBe(false);
    expect(tasksReorder.safeParse({ taskIds: ['a', 'a'] }).success).toBe(false);
    expect(statusesReorder.safeParse({ statusIds: ['a', 'a'] }).success).toBe(
      false,
    );
    expect(
      propertiesReorder.safeParse({ propertyIds: ['a', 'a'] }).success,
    ).toBe(false);
    for (const endpoint of endpoints)
      expect(
        spanishEndpointSummaries[`${endpoint.method} ${endpoint.path}`],
      ).toBeTruthy();
  });
  it('decodes cursors independently of task existence and rejects malformed values', () => {
    expect(decodeCursor(Buffer.from('task-123').toString('base64url'))).toBe(
      'task-123',
    );
    expect(() => decodeCursor('!!!!')).toThrow();
    expect(() =>
      decodeCursor(Buffer.from('invalid/path').toString('base64url')),
    ).toThrow();
  });
  it('prefers static routes without allowing dynamic handlers to shadow their methods', () => {
    expect(
      matchEndpoints('/statuses/order').map(({ endpoint }) => endpoint.method),
    ).toEqual(['PUT']);
    expect(matchEndpoints('/tasks/a/properties/b')[0]?.params).toEqual({
      id: 'a',
      propertyId: 'b',
    });
    expect(matchEndpoints('/tasks/a/extra')).toEqual([]);
  });
  it('documents every route, request bound and response without exposing configuration', () => {
    const document = getOpenApiDocument();
    expect(document.openapi).toBe('3.0.3');
    expect(Object.values(document.paths).flatMap(Object.keys)).toHaveLength(
      endpoints.length,
    );
    expect(document.paths['/tasks'].get).toMatchObject({
      security: [{ bearerAuth: [] }],
    });
    expect(JSON.stringify(document)).not.toContain(process.env.MCP_TOKEN);
    expect(JSON.stringify(document.paths)).not.toContain('/statistics');
    expect(document.components.schemas.TasksPage).toBeDefined();
  });
});
