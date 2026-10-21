import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createApiToken,
  listApiTokens,
  revokeApiToken,
} from '@/lib/api-tokens/store';
import { hashApiToken } from '@/lib/api-tokens/crypto';
import { authenticateApi } from '@/lib/api/auth';
import { consumeRateLimit, API_WRITE_LIMIT } from '@/lib/api/rate-limit';
import { listTaskPage } from '@/lib/api/pagination';
import { handleApiRequest } from '@/lib/api/handler';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const prefix = 'test:api:';

/** Removes only this suite's credentials, counters and board fixtures. */
async function cleanup() {
  const tokens = await db.apiToken.findMany({
    where: { name: { startsWith: prefix } },
    select: { id: true },
  });
  await db.apiRateLimit.deleteMany({
    where: {
      key: {
        in: [
          'instance',
          'test:api:concurrent',
          ...tokens.map(({ id }) => `token:${id}`),
        ],
      },
    },
  });
  await db.apiToken.deleteMany({ where: { name: { startsWith: prefix } } });
  await db.task.deleteMany({
    where: { status: { name: { startsWith: prefix } } },
  });
  await db.status.deleteMany({ where: { name: { startsWith: prefix } } });
  await db.taskPropertyDefinition.deleteMany({
    where: { name: { startsWith: prefix } },
  });
}
/** Creates a signed request with optional JSON input for direct HTTP-boundary integration testing. */
function request(token: string, path: string, method = 'GET', body?: unknown) {
  return new Request(`http://localhost/api/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe('persistent REST API', () => {
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await db.$disconnect();
  });

  it('stores hashes only, authenticates read/write metadata and revokes idempotently', async () => {
    const created = await createApiToken({
      name: `${prefix}token`,
      canWrite: false,
    });
    const stored = await db.apiToken.findUniqueOrThrow({
      where: { id: created.metadata.id },
    });
    expect(stored.tokenHash).toBe(hashApiToken(created.token));
    expect(JSON.stringify(stored)).not.toContain(created.token);
    expect(JSON.stringify(await listApiTokens())).not.toContain(
      stored.tokenHash,
    );
    await expect(
      authenticateApi(request(created.token, '/tasks')),
    ).resolves.toMatchObject({ canWrite: false });
    await revokeApiToken(created.metadata.id);
    await revokeApiToken(created.metadata.id);
    await expect(
      authenticateApi(request(created.token, '/tasks')),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      authenticateApi(request('forged', '/tasks')),
    ).rejects.toMatchObject({ status: 401 });
  });
  it('caps active tokens while permitting replacement after revocation', async () => {
    await db.apiToken.createMany({
      data: Array.from({ length: 25 }, (_, index) => ({
        id: `test-api-token-${index}`,
        name: `${prefix}cap-${index}`,
        hint: 'test',
        tokenHash: hashApiToken(`test-api-token-${index}`),
      })),
    });
    await expect(
      createApiToken({ name: `${prefix}over-cap`, canWrite: false }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await revokeApiToken('test-api-token-0');
    await expect(
      createApiToken({ name: `${prefix}replacement`, canWrite: false }),
    ).resolves.toMatchObject({ metadata: { revokedAt: null } });
  });
  it('enforces exact concurrent totals across independent requests and resets old windows', async () => {
    const outcomes = await Promise.all(
      Array.from({ length: 15 }, () =>
        consumeRateLimit(db, 'test:api:concurrent', false, 5),
      ),
    );
    expect(outcomes.filter((result) => result.allowed)).toHaveLength(5);
    expect(
      (
        await db.apiRateLimit.findUniqueOrThrow({
          where: { key: 'test:api:concurrent' },
        })
      ).count,
    ).toBe(5);
    await db.apiRateLimit.update({
      where: { key: 'test:api:concurrent' },
      data: { windowStart: new Date('2020-01-01T00:00:00Z') },
    });
    await expect(
      consumeRateLimit(db, 'test:api:concurrent', false, 5),
    ).resolves.toMatchObject({ allowed: true, remaining: 4 });
  });
  it('rejects writes after their budget while retaining the separate reading allowance', async () => {
    await consumeRateLimit(db, 'test:api:concurrent', true);
    await db.apiRateLimit.update({
      where: { key: 'test:api:concurrent' },
      data: { writes: API_WRITE_LIMIT },
    });
    expect(
      (await consumeRateLimit(db, 'test:api:concurrent', true)).allowed,
    ).toBe(false);
    expect(
      (await consumeRateLimit(db, 'test:api:concurrent', false)).allowed,
    ).toBe(true);
  });
  it('paginates beyond 20 completions and continues after the cursor task is deleted', async () => {
    const status = await db.status.create({
      data: {
        name: `${prefix}done`,
        color: '#123456',
        isTerminal: true,
        position: 99,
      },
    });
    await db.task.createMany({
      data: Array.from({ length: 23 }, (_, index) => ({
        id: `test-api-${index.toString().padStart(2, '0')}`,
        title: `Searchable ${index}`,
        statusId: status.id,
        position: index,
        completedAt: new Date(),
      })),
    });
    const first = await listTaskPage(db, {
      limit: 10,
      scope: 'completed',
      statusId: status.id,
      search: 'SEARCHABLE',
    });
    expect(first.data).toHaveLength(10);
    expect(first.pagination.hasMore).toBe(true);
    await db.task.delete({ where: { id: first.data.at(-1)!.id } });
    const second = await listTaskPage(db, {
      limit: 100,
      scope: 'completed',
      statusId: status.id,
      cursor: first.pagination.nextCursor!,
    });
    expect(second.data).toHaveLength(13);
    expect(second.pagination.nextCursor).toBeNull();
    expect(
      new Set([...first.data, ...second.data].map(({ id }) => id)).size,
    ).toBe(23);
  });
  it('protects all HTTP routes and reports permission, media, validation, methods and budgets', async () => {
    const read = await createApiToken({
      name: `${prefix}read`,
      canWrite: false,
    });
    const write = await createApiToken({
      name: `${prefix}write`,
      canWrite: true,
    });
    expect(
      (await handleApiRequest(request('invalid', '/tasks'), '/tasks')).status,
    ).toBe(401);
    expect(
      (
        await handleApiRequest(
          request(read.token, '/tasks', 'POST', { title: 'Forbidden' }),
          '/tasks',
        )
      ).status,
    ).toBe(403);
    const missing = await handleApiRequest(
      request(read.token, '/tasks/missing'),
      '/tasks/missing',
    );
    expect(missing.status).toBe(404);
    expect(missing.headers.get('cache-control')).toBe('no-store');
    expect((await missing.json()).error.requestId).toBe(
      missing.headers.get('x-request-id'),
    );
    expect(
      (await handleApiRequest(request(write.token, '/tasks', 'POST'), '/tasks'))
        .status,
    ).toBe(415);
    expect(
      (
        await handleApiRequest(
          request(write.token, '/tasks', 'POST', {
            title: 'x',
            dueDate: '2026-10-21T12:00:00+99:99',
          }),
          '/tasks',
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await handleApiRequest(
          request(read.token, '/tasks?limit=1&limit=2'),
          '/tasks',
        )
      ).status,
    ).toBe(422);
    const method = await handleApiRequest(
      request(read.token, '/statuses/order'),
      '/statuses/order',
    );
    expect(method.status).toBe(405);
    expect(method.headers.get('allow')).toBe('PUT');
    await db.apiRateLimit.update({
      where: { key: `token:${read.metadata.id}` },
      data: { count: 120 },
    });
    const limited = await handleApiRequest(
      request(read.token, '/tasks'),
      '/tasks',
    );
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
    await db.apiRateLimit.update({
      where: { key: 'instance' },
      data: { count: 600 },
    });
    const instanceLimited = await handleApiRequest(
      request(write.token, '/tasks'),
      '/tasks',
    );
    expect(instanceLimited.status).toBe(429);
  });
  it('composes real task, status and property operations through the registered transport', async () => {
    const { token } = await createApiToken({
      name: `${prefix}flow`,
      canWrite: true,
    });
    const statusResponse = await handleApiRequest(
      request(token, '/statuses', 'POST', {
        name: `${prefix}flow`,
        color: '#123456',
      }),
      '/statuses',
    );
    expect(statusResponse.status).toBe(201);
    const { data: status } = await statusResponse.json();
    const taskResponse = await handleApiRequest(
      request(token, '/tasks', 'POST', {
        title: 'API task',
        statusId: status.id,
      }),
      '/tasks',
    );
    expect(taskResponse.status).toBe(201);
    const { data: task } = await taskResponse.json();
    const propResponse = await handleApiRequest(
      request(token, '/properties', 'POST', {
        name: `${prefix}priority`,
        type: 'SELECT',
        options: ['High', 'Low'],
      }),
      '/properties',
    );
    expect(propResponse.status).toBe(201);
    const { data: prop } = await propResponse.json();
    const valuePath = `/tasks/${task.id}/properties/${prop.id}`;
    expect(
      (
        await handleApiRequest(
          request(token, valuePath, 'PUT', { value: 'High' }),
          valuePath,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await handleApiRequest(
          request(token, valuePath, 'PUT', { value: 'Unknown' }),
          valuePath,
        )
      ).status,
    ).toBe(422);
    const movePath = `/tasks/${task.id}/move`;
    expect(
      (
        await handleApiRequest(
          request(token, movePath, 'POST', { statusId: status.id, index: 0 }),
          movePath,
        )
      ).status,
    ).toBe(200);
    const path = `/tasks/${task.id}`;
    const fetched = await handleApiRequest(request(token, path), path);
    expect((await fetched.json()).data.propertyValues).toEqual([
      { propertyId: prop.id, value: 'High' },
    ]);
    expect(
      (await handleApiRequest(request(token, path, 'DELETE'), path)).status,
    ).toBe(204);
  });
});
