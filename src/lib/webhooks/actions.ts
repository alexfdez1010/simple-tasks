'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthenticated } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { decryptWebhookSecret } from '@/lib/webhooks/crypto';
import { dispatchWebhookBatch } from '@/lib/webhooks/dispatcher';
import {
  queueWebhookTest,
  retryWebhookDelivery,
  saveWebhookSettings,
} from '@/lib/webhooks/store';
import { scheduleWebhookDelivery } from '@/lib/webhooks/schedule';

/** Saves owner configuration; safe error codes reveal neither DNS responses nor credential-bearing URLs. */
export async function saveWebhookAction(input: unknown) {
  try {
    await requireAuthenticated();
    await saveWebhookSettings(input);
    revalidatePath('/connections');
    return { success: true } as const;
  } catch {
    return { success: false, error: 'SAVE_FAILED' } as const;
  }
}

/** Reveals the signing secret only after an explicit authenticated owner request. */
export async function revealWebhookSecretAction() {
  try {
    await requireAuthenticated();
    const endpoint = await db.webhookEndpoint.findUniqueOrThrow({
      where: { id: 'default' },
    });
    return {
      success: true,
      secret: decryptWebhookSecret(endpoint.secret),
    } as const;
  } catch {
    return { success: false } as const;
  }
}

/** Delivers one test synchronously so its result can be inspected; task mutations remain asynchronous. */
export async function testWebhookAction() {
  try {
    await requireAuthenticated();
    const id = await queueWebhookTest();
    await dispatchWebhookBatch(db, undefined, id);
    revalidatePath('/connections');
    return { success: true } as const;
  } catch {
    return { success: false } as const;
  }
}

/** Retries one eligible event after the response without changing its stable payload or event id. */
export async function retryWebhookAction(id: string) {
  try {
    await requireAuthenticated();
    await retryWebhookDelivery(id);
    scheduleWebhookDelivery();
    revalidatePath('/connections');
    return { success: true } as const;
  } catch {
    return { success: false } as const;
  }
}
