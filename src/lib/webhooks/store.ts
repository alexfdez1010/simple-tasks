import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { runSerializable } from '@/lib/db/transaction';
import { encryptWebhookSecret, newWebhookSecret } from '@/lib/webhooks/crypto';
import { resolveWebhookTarget } from '@/lib/webhooks/target';

const settingsSchema = z
  .object({ url: z.string().trim().url().max(2048), enabled: z.boolean() })
  .strict();

/** Returns configuration without the secret and ten recent results without task payloads. */
export async function readWebhookSettings() {
  const [endpoint, deliveries] = await Promise.all([
    db.webhookEndpoint.findUnique({
      where: { id: 'default' },
      select: { url: true, enabled: true, revision: true },
    }),
    db.webhookDelivery.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        revision: true,
        lockedUntil: true,
        event: true,
        state: true,
        attempts: true,
        responseCode: true,
        error: true,
        createdAt: true,
        nextAttemptAt: true,
      },
    }),
  ]);
  return {
    endpoint: endpoint
      ? { url: endpoint.url, enabled: endpoint.enabled }
      : null,
    deliveries: deliveries.map(({ revision, lockedUntil, ...row }) => ({
      ...row,
      canRetry: Boolean(
        endpoint?.enabled &&
        revision === endpoint.revision &&
        ['PENDING', 'FAILED'].includes(row.state) &&
        (!lockedUntil || lockedUntil.getTime() <= Date.now()),
      ),
      createdAt: row.createdAt.toISOString(),
      nextAttemptAt: row.nextAttemptAt.toISOString(),
    })),
  };
}

/** Saves the single destination, preserving its secret and cancelling old queued sends on a configuration change. */
export async function saveWebhookSettings(input: unknown): Promise<void> {
  const settings = settingsSchema.parse(input);
  const url = new URL(settings.url);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.hash ||
    (url.port && url.port !== '443')
  )
    throw new Error('INVALID_URL');
  if (settings.enabled) await resolveWebhookTarget(settings.url);
  await runSerializable(db, async (transaction) => {
    const current = await transaction.webhookEndpoint.findUnique({
      where: { id: 'default' },
    });
    if (current?.url === settings.url && current.enabled === settings.enabled)
      return;
    await transaction.webhookEndpoint.upsert({
      where: { id: 'default' },
      create: { ...settings, secret: encryptWebhookSecret(newWebhookSecret()) },
      update: { ...settings, revision: { increment: 1 } },
    });
    await transaction.webhookDelivery.updateMany({
      where: { state: 'PENDING' },
      data: { state: 'CANCELLED', claimToken: null, lockedUntil: null },
    });
  });
}

/** Queues a clearly marked test without creating or editing a task. */
export async function queueWebhookTest(): Promise<string> {
  return runSerializable(db, async (transaction) => {
    const endpoint = await transaction.webhookEndpoint.findUnique({
      where: { id: 'default' },
    });
    if (!endpoint?.enabled) throw new Error('DISABLED');
    const id = randomUUID();
    await transaction.webhookDelivery.create({
      data: {
        id,
        event: 'webhook.test',
        revision: endpoint.revision,
        payload: {
          schemaVersion: 1,
          id,
          type: 'webhook.test',
          occurredAt: new Date().toISOString(),
          data: { task: null, previousStatusId: null },
        },
      },
    });
    return id;
  });
}

/** Restarts a failed/queued delivery only for the currently active destination and an expired lease. */
export async function retryWebhookDelivery(id: string): Promise<void> {
  await runSerializable(db, async (transaction) => {
    const endpoint = await transaction.webhookEndpoint.findUnique({
      where: { id: 'default' },
    });
    if (!endpoint?.enabled) throw new Error('DISABLED');
    const result = await transaction.webhookDelivery.updateMany({
      where: {
        id: z.string().uuid().parse(id),
        revision: endpoint.revision,
        state: { in: ['PENDING', 'FAILED'] },
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: new Date() } }],
      },
      data: {
        state: 'PENDING',
        attempts: 0,
        error: null,
        responseCode: null,
        nextAttemptAt: new Date(),
        claimToken: null,
        lockedUntil: null,
      },
    });
    if (!result.count) throw new Error('NOT_RETRYABLE');
  });
}
