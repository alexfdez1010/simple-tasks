import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as dispatchRequest } from '@/app/api/webhooks/dispatch/route';
import { createApiToken, revokeApiToken } from '@/lib/api-tokens/store';
import { db } from '@/lib/db/client';
import { PrismaTaskRepository } from '@/lib/tasks/prisma-repository';
import { PrismaPropertyRepository } from '@/lib/properties/prisma-repository';
import { encryptWebhookSecret } from '@/lib/webhooks/crypto';
import type { WebhookTransport } from '@/lib/webhooks/transport';
import { dispatchWebhookBatch } from '@/lib/webhooks/dispatcher';
import {
  readWebhookSettings,
  saveWebhookSettings,
  queueWebhookTest,
  retryWebhookDelivery,
} from '@/lib/webhooks/store';
import { recordTaskEvent } from '@/lib/webhooks/outbox';
import { runSerializable } from '@/lib/db/transaction';

vi.mock('@/lib/webhooks/target', () => ({
  resolveWebhookTarget: vi.fn(async () => ({})),
}));
const repository = new PrismaTaskRepository(db);
const properties = new PrismaPropertyRepository(db);
const PREFIX = 'test:webhook:';
const SECRET = 'whsec_test-secret';
let sourceId: string;
let targetId: string;

/** Removes only fixture tasks/configuration; suites run serially against a disposable database. */
async function cleanup() {
  await db.apiToken.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.webhookDelivery.deleteMany();
  await db.webhookEndpoint.deleteMany();
  await db.task.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await db.status.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.taskPropertyDefinition.deleteMany({
    where: { name: { startsWith: PREFIX } },
  });
}

/** Starts each case with two isolated workflow states and a configured encrypted endpoint. */
async function setup() {
  await cleanup();
  sourceId = (
    await db.status.create({
      data: { name: PREFIX + 'source', color: '#64748b', position: 100 },
    })
  ).id;
  targetId = (
    await db.status.create({
      data: {
        name: PREFIX + 'target',
        color: '#22c55e',
        position: 101,
        isTerminal: true,
      },
    })
  ).id;
  await db.webhookEndpoint.create({
    data: {
      url: 'https://receiver.example/hook',
      secret: encryptWebhookSecret(SECRET),
    },
  });
}

/** Creates a fixture through the same repository used by the UI, REST and MCP services. */
async function createTask(suffix = 'task') {
  return repository.create({
    title: PREFIX + suffix,
    description: 'Markdown **details**',
    statusId: sourceId,
  });
}

beforeEach(setup);
afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe('transactional task events', () => {
  it('records create/edit/move/property changes/delete snapshots once with current data', async () => {
    const task = await createTask();
    await repository.update({ id: task.id, title: PREFIX + 'edited' });
    await repository.move({ id: task.id, statusId: targetId, index: 0 });
    const property = await db.taskPropertyDefinition.create({
      data: {
        name: PREFIX + 'owner',
        type: 'SELECT',
        options: ['Codex'],
        position: 100,
      },
    });
    await properties.setValue({
      taskId: task.id,
      propertyId: property.id,
      value: 'Codex',
    });
    let events = await db.webhookDelivery.findMany({
      orderBy: { createdAt: 'asc' },
    });
    expect(events.map((event) => event.event)).toEqual([
      'task.created',
      'task.updated',
      'task.moved',
      'task.updated',
    ]);
    const moved = events[2].payload as Record<string, unknown>;
    expect(moved).toMatchObject({
      schemaVersion: 1,
      id: events[2].id,
      type: 'task.moved',
      data: {
        previousStatusId: sourceId,
        task: { statusId: targetId, status: { isTerminal: true } },
      },
    });
    expect(
      (moved.data as { task: { completedAt: string } }).task.completedAt,
    ).toBeTruthy();
    expect(events[3].payload).toMatchObject({
      data: {
        task: {
          propertyValues: [
            {
              propertyId: property.id,
              name: PREFIX + 'owner',
              type: 'SELECT',
              value: 'Codex',
            },
          ],
        },
      },
    });
    await properties.deleteValue(task.id, property.id);
    await repository.delete(task.id);
    events = await db.webhookDelivery.findMany({
      orderBy: { createdAt: 'asc' },
    });
    expect(events).toHaveLength(6);
    expect(events.at(-1)?.payload).toMatchObject({
      type: 'task.deleted',
      data: {
        task: {
          id: task.id,
          title: PREFIX + 'edited',
          description: 'Markdown **details**',
          propertyValues: [],
        },
      },
    });
    expect(await db.task.findUnique({ where: { id: task.id } })).toBeNull();
  });
  it('identifies status changes through update as moved and positional reorders as updated', async () => {
    const first = await createTask('first');
    const second = await createTask('second');
    await repository.reorder({
      statusId: sourceId,
      taskIds: [second.id, first.id],
    });
    expect(
      await db.webhookDelivery.count({ where: { event: 'task.updated' } }),
    ).toBe(2);
    await repository.update({ id: first.id, statusId: targetId, index: 0 });
    expect(
      await db.webhookDelivery.count({ where: { event: 'task.moved' } }),
    ).toBe(1);
    const terminal = await repository.create({
      title: PREFIX + 'terminal',
      statusId: targetId,
    });
    expect(
      await db.webhookDelivery.findFirst({
        where: {
          event: 'task.created',
          payload: { path: ['data', 'task', 'id'], equals: terminal.id },
        },
      }),
    ).toBeTruthy();
  });
  it('does not queue paused changes and rolls back both the mutation and event on transaction failure', async () => {
    await db.webhookEndpoint.update({
      where: { id: 'default' },
      data: { enabled: false },
    });
    const task = await createTask();
    expect(await db.webhookDelivery.count()).toBe(0);
    await db.webhookEndpoint.update({
      where: { id: 'default' },
      data: { enabled: true },
    });
    await expect(
      runSerializable(db, async (tx) => {
        await tx.task.update({
          where: { id: task.id },
          data: { title: PREFIX + 'rollback' },
        });
        await recordTaskEvent(tx, 'task.updated', task.id);
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(await db.webhookDelivery.count()).toBe(0);
    expect(
      (await db.task.findUniqueOrThrow({ where: { id: task.id } })).title,
    ).toBe(PREFIX + 'task');
    await expect(
      repository.create({
        title: PREFIX + 'invalid',
        statusId: sourceId,
        propertyValues: [{ propertyId: 'missing', value: 'x' }],
      }),
    ).rejects.toThrow();
    expect(await db.task.count({ where: { title: PREFIX + 'invalid' } })).toBe(
      0,
    );
    expect(await db.webhookDelivery.count()).toBe(0);
  });
});

describe('delivery ownership and retries', () => {
  it('leases an event once across concurrent workers and sends its stable payload with the stored secret', async () => {
    await createTask();
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started!: () => void;
    const startedPromise = new Promise<void>((resolve) => {
      started = resolve;
    });
    const send = vi.fn<WebhookTransport>(async () => {
      started();
      await wait;
      return 204;
    });
    const first = dispatchWebhookBatch(db, send);
    await startedPromise;
    expect(await dispatchWebhookBatch(db, send)).toBe(0);
    release();
    expect(await first).toBe(1);
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toMatchObject({
      secret: SECRET,
      event: 'task.created',
      url: 'https://receiver.example/hook',
    });
    const row = await db.webhookDelivery.findFirstOrThrow();
    expect(JSON.parse(send.mock.calls[0][0].body).id).toBe(row.id);
    expect(row).toMatchObject({
      state: 'DELIVERED',
      attempts: 1,
      responseCode: 204,
      claimToken: null,
      lockedUntil: null,
    });
  });
  it('retries five times, exposes only safe errors, and permits explicit retry with the same id', async () => {
    await createTask();
    const send = vi.fn<WebhookTransport>(async () => 503);
    const original = await db.webhookDelivery.findFirstOrThrow();
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await db.webhookDelivery.update({
        where: { id: original.id },
        data: { nextAttemptAt: new Date(0) },
      });
      await dispatchWebhookBatch(db, send);
      const row = await db.webhookDelivery.findUniqueOrThrow({
        where: { id: original.id },
      });
      expect(row.attempts).toBe(attempt);
      expect(row.state).toBe(attempt === 5 ? 'FAILED' : 'PENDING');
    }
    expect(await dispatchWebhookBatch(db, send)).toBe(0);
    await retryWebhookDelivery(original.id);
    await dispatchWebhookBatch(db, async () => 200);
    const row = await db.webhookDelivery.findUniqueOrThrow({
      where: { id: original.id },
    });
    expect(row).toMatchObject({
      state: 'DELIVERED',
      attempts: 1,
      error: null,
      responseCode: 200,
    });
    expect(row.payload).toEqual(original.payload);
  });
  it('recovers expired leases and treats transport rejection as a queued retry', async () => {
    await createTask();
    const row = await db.webhookDelivery.findFirstOrThrow();
    await db.webhookDelivery.update({
      where: { id: row.id },
      data: {
        lockedUntil: new Date(0),
        claimToken: 'interrupted',
        attempts: 1,
      },
    });
    await dispatchWebhookBatch(db, async () => {
      throw new Error('sensitive response body');
    });
    expect(
      await db.webhookDelivery.findUniqueOrThrow({ where: { id: row.id } }),
    ).toMatchObject({
      state: 'PENDING',
      attempts: 2,
      error: 'DELIVERY_FAILED',
      claimToken: null,
    });
  });
  it('cancels the old queue when paused and retains one endpoint and its encrypted secret', async () => {
    await createTask();
    const endpoint = await db.webhookEndpoint.findUniqueOrThrow({
      where: { id: 'default' },
    });
    await saveWebhookSettings({ url: endpoint.url, enabled: false });
    expect(await db.webhookEndpoint.count()).toBe(1);
    expect(
      (await db.webhookEndpoint.findUniqueOrThrow({ where: { id: 'default' } }))
        .secret,
    ).toBe(endpoint.secret);
    expect((await db.webhookDelivery.findFirstOrThrow()).state).toBe(
      'CANCELLED',
    );
    expect(await dispatchWebhookBatch(db, vi.fn())).toBe(0);
    const settings = await readWebhookSettings();
    expect(JSON.stringify(settings)).not.toContain(SECRET);
    expect(JSON.stringify(settings)).not.toContain(endpoint.secret);
    expect(settings.deliveries[0]).not.toHaveProperty('payload');
  });
  it('uses existing API token permissions for scheduler access and rejects revoked tokens', async () => {
    const url =
      'https://tasks.alejandrofernandezcamello.me/api/webhooks/dispatch';
    expect(
      (await dispatchRequest(new Request(url, { method: 'POST' }))).status,
    ).toBe(401);
    const read = await createApiToken({
      name: PREFIX + 'read',
      canWrite: false,
    });
    const write = await createApiToken({
      name: PREFIX + 'write',
      canWrite: true,
    });
    expect(
      (
        await dispatchRequest(
          new Request(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${read.token}` },
          }),
        )
      ).status,
    ).toBe(403);
    const response = await dispatchRequest(
      new Request(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${write.token}` },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ data: { processed: 0 } });
    await revokeApiToken(write.metadata.id);
    expect(
      (
        await dispatchRequest(
          new Request(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${write.token}` },
          }),
        )
      ).status,
    ).toBe(401);
  });
  it('does not exceed the five-send budget when the last lease was interrupted', async () => {
    await createTask();
    const row = await db.webhookDelivery.findFirstOrThrow();
    await db.webhookDelivery.update({
      where: { id: row.id },
      data: {
        attempts: 5,
        lockedUntil: new Date(0),
        claimToken: 'interrupted',
      },
    });
    const send = vi.fn<WebhookTransport>(async () => 200);
    await dispatchWebhookBatch(db, send);
    expect(send).not.toHaveBeenCalled();
    expect(
      await db.webhookDelivery.findUniqueOrThrow({ where: { id: row.id } }),
    ).toMatchObject({ state: 'FAILED', attempts: 5 });
  });
  it('sends a marked test without touching tasks, and prioritizes that exact event', async () => {
    await createTask();
    const count = await db.task.count();
    const testId = await queueWebhookTest();
    const send = vi.fn<WebhookTransport>(async () => 200);
    expect(await dispatchWebhookBatch(db, send, testId)).toBe(1);
    expect(send.mock.calls[0][0].event).toBe('webhook.test');
    expect(JSON.parse(send.mock.calls[0][0].body)).toMatchObject({
      type: 'webhook.test',
      data: { task: null },
    });
    expect(await db.task.count()).toBe(count);
    expect(
      await db.webhookDelivery.count({ where: { state: 'PENDING' } }),
    ).toBe(1);
  });
});
