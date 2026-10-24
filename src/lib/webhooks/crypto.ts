import 'server-only';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from 'node:crypto';
import { getAuthConfig } from '@/lib/auth/config';

/** Derives a domain-separated encryption key from the instance's existing authentication secret. */
function encryptionKey(): Buffer {
  return createHash('sha256')
    .update(`simple-tasks:webhook:v1:${getAuthConfig().secret}`)
    .digest();
}

/** Creates a signing secret that is stored encrypted in PostgreSQL, never in client configuration. */
export function newWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString('base64url')}`;
}

/** Authenticates and encrypts a signing secret for storage; each write uses a fresh nonce. */
export function encryptWebhookSecret(secret: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), nonce);
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  return [nonce, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString('base64url'))
    .join('.');
}

/** Decrypts an authenticated stored secret; corrupted values or a changed AUTH_SECRET reject. */
export function decryptWebhookSecret(value: string): string {
  const [nonce, tag, encrypted] = value
    .split('.')
    .map((part) => Buffer.from(part, 'base64url'));
  if (!nonce || !tag || !encrypted) throw new Error('INVALID_SECRET');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}

/** Signs the exact UTF-8 request body and Unix-second timestamp; receivers verify both. */
export function signWebhook(
  secret: string,
  timestamp: string,
  body: string,
): string {
  return `v1=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}
