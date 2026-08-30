import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_MAX_AGE,
  LANGUAGE_COOKIE_NAME,
} from '@/lib/i18n/config';

const cookieGet = vi.fn();
const cookieSet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: cookieGet,
    set: cookieSet,
  })),
}));

describe('language cookie server helpers', () => {
  /** Resets cookie spies and isolates production-only cookie behavior. */
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'test');
  });

  /** Restores the caller's environment after every language case. */
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** Proves a valid persisted cookie is returned by the request reader. */
  it('reads a supported language cookie', async () => {
    cookieGet.mockReturnValue({ value: 'es' });
    const { getCurrentLanguage } = await import('@/lib/i18n/server');

    await expect(getCurrentLanguage()).resolves.toBe('es');
    expect(cookieGet).toHaveBeenCalledWith(LANGUAGE_COOKIE_NAME);
  });

  /** Proves absent and forged cookies use the safe English default. */
  it('falls back to English for missing or unsupported cookies', async () => {
    const { getCurrentLanguage } = await import('@/lib/i18n/server');

    cookieGet.mockReturnValueOnce(undefined);
    await expect(getCurrentLanguage()).resolves.toBe(DEFAULT_LANGUAGE);

    cookieGet.mockReturnValueOnce({ value: 'fr' });
    await expect(getCurrentLanguage()).resolves.toBe(DEFAULT_LANGUAGE);
  });

  /** Proves valid language writes use the complete hardened cookie contract. */
  it('sets a valid language cookie with scoped lifetime and attributes', async () => {
    const { setLanguageAction } = await import('@/lib/i18n/server');

    await expect(setLanguageAction('es')).resolves.toEqual({
      data: 'es',
      success: true,
    });
    expect(cookieSet).toHaveBeenCalledWith(LANGUAGE_COOKIE_NAME, 'es', {
      httpOnly: true,
      maxAge: LANGUAGE_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  /** Proves production requests mark the preference cookie secure. */
  it('marks the language cookie secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { setLanguageAction } = await import('@/lib/i18n/server');

    await setLanguageAction('en');

    expect(cookieSet).toHaveBeenCalledWith(
      LANGUAGE_COOKIE_NAME,
      'en',
      expect.objectContaining({ secure: true }),
    );
  });

  /** Proves invalid action input is rejected without changing browser state. */
  it.each([undefined, null, '', 'fr', 'en-US', 1, {}, []])(
    'rejects unsupported language input %s without writing a cookie',
    async (value) => {
      const { setLanguageAction } = await import('@/lib/i18n/server');

      await expect(setLanguageAction(value)).resolves.toEqual({
        error: 'Unsupported language.',
        success: false,
      });
      expect(cookieSet).not.toHaveBeenCalled();
    },
  );
});
