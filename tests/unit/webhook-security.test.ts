import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { isPublicAddress, resolveWebhookTarget } from '@/lib/webhooks/target';
import {
  decryptWebhookSecret,
  encryptWebhookSecret,
  newWebhookSecret,
  signWebhook,
} from '@/lib/webhooks/crypto';
import { webhookVerificationExample } from '@/components/connections/webhook-examples';

const publicDns = vi.fn(async () => [{ address: '8.8.8.8', family: 4 }]);

describe('webhook destinations', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });
  it.each([
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '192.168.2.1',
    '169.254.169.254',
    '0.0.0.0',
    '100.64.0.1',
    '192.0.2.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fc00::1',
    'fe80::1',
    '2001:db8::1',
    '::ffff:127.0.0.1',
    '64:ff9b::a00:1',
  ])('blocks non-public address %s', (address) =>
    expect(isPublicAddress(address)).toBe(false),
  );
  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])(
    'allows public address %s',
    (address) => expect(isPublicAddress(address)).toBe(true),
  );
  it.each([
    'http://example.com/hook',
    'https://user:pass@example.com/hook',
    'https://example.com/hook#part',
    'https://example.com:8443/hook',
  ])('rejects unsafe URL shape %s before DNS', async (url) => {
    await expect(resolveWebhookTarget(url, publicDns)).rejects.toThrow();
    expect(publicDns).not.toHaveBeenCalled();
  });
  it('rejects mixed public/private DNS and pins the first validated public address', async () => {
    await expect(
      resolveWebhookTarget('https://example.com/hook', async () => [
        { address: '8.8.8.8', family: 4 },
        { address: '127.0.0.1', family: 4 },
      ]),
    ).rejects.toThrow('UNSAFE_TARGET');
    const target = await resolveWebhookTarget(
      'https://example.com/hook',
      publicDns,
    );
    expect(target.address).toEqual({ address: '8.8.8.8', family: 4 });
    expect(publicDns).toHaveBeenCalledOnce();
  });
  it('bounds DNS time and ignores a resolver that never completes', async () => {
    vi.useFakeTimers();
    const result = expect(
      resolveWebhookTarget(
        'https://example.com/hook',
        () => new Promise(() => {}),
      ),
    ).rejects.toThrow('DNS_TIMEOUT');
    await vi.advanceTimersByTimeAsync(3000);
    await result;
  });
});

describe('webhook credentials and signatures', () => {
  it('stores authenticated ciphertext with fresh nonces, not the signing secret', () => {
    vi.stubEnv('PASSWORD', 'test-password');
    vi.stubEnv(
      'AUTH_SECRET',
      'test-auth-secret-at-least-thirty-two-characters',
    );
    const secret = newWebhookSecret();
    const encrypted = encryptWebhookSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(encrypted).not.toBe(encryptWebhookSecret(secret));
    expect(decryptWebhookSecret(encrypted)).toBe(secret);
    const parts = encrypted.split('.');
    parts[1] = Buffer.alloc(16).toString('base64url');
    expect(() => decryptWebhookSecret(parts.join('.'))).toThrow();
    vi.unstubAllEnvs();
  });
  it('matches the published verifier and rejects changed content, stale time and malformed signatures', () => {
    const body = '{"type":"task.created"}';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const secret = 'test-secret';
    const verify = runInNewContext(
      webhookVerificationExample.replace(/^import[^\n]+\n/, '') + '\nverify;',
      { createHmac, timingSafeEqual, Buffer, Date },
    ) as (
      body: string,
      timestamp: string,
      signature: string,
      secret: string,
    ) => boolean;
    const signature = signWebhook(secret, timestamp, body);
    expect(verify(body, timestamp, signature, secret)).toBe(true);
    expect(verify(body + ' ', timestamp, signature, secret)).toBe(false);
    expect(verify(body, '1', signature, secret)).toBe(false);
    expect(verify(body, timestamp, 'v1=00', secret)).toBe(false);
  });
});
