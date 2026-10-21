import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

/** Hashes a high-entropy credential for lookup; never persists the raw secret. */
export function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Creates a 256-bit random bearer secret and a non-secret identifying hint. */
export function generateApiToken() {
  const token = `st_${randomBytes(32).toString('base64url')}`;
  return {
    token,
    tokenHash: hashApiToken(token),
    hint: `${token.slice(0, 11)}…${token.slice(-4)}`,
  };
}
