import 'server-only';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@/generated/prisma';
import { decryptWebhookSecret } from '@/lib/webhooks/crypto';
import { postWebhook, type WebhookTransport } from '@/lib/webhooks/transport';

const MAX_ATTEMPTS = 5;
const RETRY_SECONDS = [60, 300, 1800, 7200];

/** Drains a bounded batch with expiring leases; failures never propagate into committed task mutations. */
export async function dispatchWebhookBatch(
  client: PrismaClient,
  send: WebhookTransport = postWebhook,
  onlyId?: string,
): Promise<number> {
  const endpoint = await client.webhookEndpoint.findUnique({
    where: { id: 'default' },
  });
  if (!endpoint?.enabled) return 0;
  const now = new Date();
  const rows = await client.webhookDelivery.findMany({
    where: {
      ...(onlyId ? { id: onlyId } : {}),
      state: 'PENDING',
      revision: endpoint.revision,
      nextAttemptAt: { lte: now },
      OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
    },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });
  let processed = 0;
  for (const row of rows) {
    if (row.attempts >= MAX_ATTEMPTS) {
      const exhausted = await client.webhookDelivery.updateMany({
        where: {
          id: row.id,
          state: 'PENDING',
          attempts: row.attempts,
          OR: [{ lockedUntil: null }, { lockedUntil: { lte: new Date() } }],
        },
        data: {
          state: 'FAILED',
          error: 'ATTEMPTS_EXHAUSTED',
          lockedUntil: null,
          claimToken: null,
        },
      });
      processed += exhausted.count;
      continue;
    }
    const claimToken = randomUUID();
    const claimed = await client.webhookDelivery.updateMany({
      where: {
        id: row.id,
        state: 'PENDING',
        attempts: row.attempts,
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: new Date() } }],
      },
      data: {
        claimToken,
        lockedUntil: new Date(Date.now() + 60_000),
        attempts: { increment: 1 },
      },
    });
    if (!claimed.count) continue;
    const current = await client.webhookEndpoint.findUnique({
      where: { id: 'default' },
    });
    if (!current?.enabled || current.revision !== row.revision) {
      await client.webhookDelivery.updateMany({
        where: { id: row.id, claimToken },
        data: { state: 'CANCELLED', lockedUntil: null, claimToken: null },
      });
      continue;
    }
    let responseCode: number | null = null;
    let error: string | null = null;
    if (row.attempts >= MAX_ATTEMPTS) error = 'ATTEMPTS_EXHAUSTED';
    else {
      try {
        responseCode = await send({
          url: current.url,
          secret: decryptWebhookSecret(current.secret),
          id: row.id,
          event: row.event,
          body: JSON.stringify(row.payload),
        });
        if (responseCode < 200 || responseCode >= 300) error = 'HTTP_ERROR';
      } catch {
        error = 'DELIVERY_FAILED';
      }
    }
    const attempts = row.attempts + 1;
    const state = !error
      ? 'DELIVERED'
      : attempts >= MAX_ATTEMPTS
        ? 'FAILED'
        : 'PENDING';
    await client.webhookDelivery.updateMany({
      where: { id: row.id, claimToken, state: 'PENDING' },
      data: {
        state,
        responseCode,
        error,
        deliveredAt: error ? null : new Date(),
        nextAttemptAt: new Date(
          Date.now() +
            (RETRY_SECONDS[Math.min(attempts - 1, 3)] ?? 7200) * 1000,
        ),
        lockedUntil: null,
        claimToken: null,
      },
    });
    processed += 1;
  }
  await client.webhookDelivery.deleteMany({
    where: {
      state: { in: ['DELIVERED', 'FAILED', 'CANCELLED'] },
      createdAt: { lt: new Date(Date.now() - 14 * 86400_000) },
    },
  });
  return processed;
}
