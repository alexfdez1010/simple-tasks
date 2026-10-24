import 'server-only';
import { after } from 'next/server';
import { db } from '@/lib/db/client';
import { dispatchWebhookBatch } from '@/lib/webhooks/dispatcher';

/** Registers a bounded after-response drain; persisted deliveries survive interruption or transport failure. */
export function scheduleWebhookDelivery(): void {
  try {
    after(async () => {
      try {
        await dispatchWebhookBatch(db);
      } catch {
        console.error(
          'Webhook delivery batch failed; pending events remain queued.',
        );
      }
    });
  } catch {
    console.error(
      'Webhook scheduling unavailable; pending events remain queued.',
    );
  }
}
