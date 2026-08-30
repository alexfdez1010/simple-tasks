import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LANGUAGE,
  isLanguage,
  LANGUAGE_COOKIE_MAX_AGE,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_LOCALES,
  resolveLanguage,
} from '@/lib/i18n/config';

describe('language configuration', () => {
  /** Proves the supported identifiers map to stable browser locales. */
  it('defines the English and Spanish locale catalog', () => {
    expect(LANGUAGE_LOCALES).toEqual({ en: 'en-US', es: 'es-ES' });
    expect(DEFAULT_LANGUAGE).toBe('en');
    expect(LANGUAGE_COOKIE_NAME).toBe('simple-tasks-language');
    expect(LANGUAGE_COOKIE_MAX_AGE).toBe(31_536_000);
  });

  /** Proves only the exact supported identifiers pass validation. */
  it.each(['en', 'es'])('accepts %s as a language', (value) => {
    expect(isLanguage(value)).toBe(true);
  });

  /** Proves malformed, regional, and non-string values are rejected. */
  it.each([undefined, null, '', 'EN', 'en-US', 'fr', 1, {}, []])(
    'rejects %s as a language',
    (value) => {
      expect(isLanguage(value)).toBe(false);
    },
  );

  /** Proves invalid persisted values fail closed to the English default. */
  it.each([undefined, null, '', 'EN', 'en-US', 'fr', 1, {}, []])(
    'resolves %s to English',
    (value) => {
      expect(resolveLanguage(value)).toBe(DEFAULT_LANGUAGE);
    },
  );

  /** Proves valid persisted values survive resolution unchanged. */
  it.each(['en', 'es'])('resolves %s unchanged', (value) => {
    expect(resolveLanguage(value)).toBe(value);
  });
});
