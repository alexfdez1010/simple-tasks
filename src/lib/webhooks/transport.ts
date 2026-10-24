import 'server-only';
import { request } from 'node:https';
import { resolveWebhookTarget } from '@/lib/webhooks/target';
import { signWebhook } from '@/lib/webhooks/crypto';

export interface WebhookRequest {
  url: string;
  secret: string;
  id: string;
  event: string;
  body: string;
}
export type WebhookTransport = (input: WebhookRequest) => Promise<number>;

/** Sends one signed request with validated/pinned DNS, certificate verification, no redirects and a total deadline. */
export async function postWebhook(input: WebhookRequest): Promise<number> {
  const target = await resolveWebhookTarget(input.url);
  return new Promise((resolve, reject) => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const req = request(
      target.url,
      {
        method: 'POST',
        agent: false,
        family: target.address.family,
        lookup: (_host, _options, callback) =>
          callback(null, target.address.address, target.address.family),
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(input.body),
          'User-Agent': 'Simple-Tasks-Webhooks/1',
          'X-Simple-Tasks-Id': input.id,
          'X-Simple-Tasks-Event': input.event,
          'X-Simple-Tasks-Timestamp': timestamp,
          'X-Simple-Tasks-Signature': signWebhook(
            input.secret,
            timestamp,
            input.body,
          ),
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        response.destroy();
        resolve(status);
      },
    );
    const timer = setTimeout(() => req.destroy(new Error('TIMEOUT')), 5000);
    req.on('close', () => clearTimeout(timer));
    req.on('error', () => reject(new Error('DELIVERY_FAILED')));
    req.end(input.body);
  });
}
