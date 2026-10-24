import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@/generated/prisma';

/** Explicit disposable URL prevents E2E fixture code from ever using the deployment's .env database. */
export const webhookTestDb = new PrismaClient({
  datasourceUrl:
    process.env.TEST_DATABASE_URL ??
    `postgresql://postgres:postgres@localhost:${process.env.TEST_DATABASE_PORT ?? '55433'}/simple_tasks_test?schema=public`,
});
export const fixtureSigningSecret = 'whsec_e2e-signing-secret';

/** Builds a stored credential using the isolated server's known test AUTH_SECRET. */
function fixtureCiphertext(): string {
  const key = createHash('sha256')
    .update(
      `simple-tasks:webhook:v1:${process.env.AUTH_SECRET ?? 'test-auth-secret-at-least-thirty-two-characters'}`,
    )
    .digest();
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const encrypted = Buffer.concat([
    cipher.update(fixtureSigningSecret, 'utf8'),
    cipher.final(),
  ]);
  return [nonce, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString('base64url'))
    .join('.');
}

/** Seeds a formerly configured destination that is now blocked, so tests never send task data externally. */
export async function seedBlockedWebhook() {
  await clearWebhookFixtures();
  await webhookTestDb.webhookEndpoint.create({
    data: { url: 'https://127.0.0.1/events', secret: fixtureCiphertext() },
  });
}

/** Removes the singleton and its fixture deliveries after the browser scenario. */
export async function clearWebhookFixtures() {
  await webhookTestDb.webhookDelivery.deleteMany();
  await webhookTestDb.webhookEndpoint.deleteMany();
}
