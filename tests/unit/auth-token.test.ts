import { describe, expect, it } from 'vitest';

import {
  createSessionToken,
  digestToken,
  timingSafeMatch,
} from '@/lib/auth/token';

describe('authentication token primitives', () => {
  /** Proves token derivation is stable, fixed-width, and purpose-bound. */
  it('derives deterministic hexadecimal session tokens', async () => {
    const first = await createSessionToken('password', 'secret');
    const second = await createSessionToken('password', 'secret');

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(await digestToken('password', 'secret'));
  });

  /** Proves changing either credential invalidates an existing token. */
  it('separates tokens by password and secret', async () => {
    const baseline = await createSessionToken('password', 'secret');

    expect(await createSessionToken('other', 'secret')).not.toBe(baseline);
    expect(await createSessionToken('password', 'other')).not.toBe(baseline);
  });

  /** Proves constant-work comparison handles equal, unequal, and empty strings. */
  it('compares candidate values through fixed-length digests', async () => {
    await expect(timingSafeMatch('same', 'same', 'secret')).resolves.toBe(true);
    await expect(timingSafeMatch('same', 'different', 'secret')).resolves.toBe(
      false,
    );
    await expect(timingSafeMatch('', 'different', 'secret')).resolves.toBe(
      false,
    );
  });
});
