/** Supported application language identifiers and their BCP 47 locales. */
export const LANGUAGE_LOCALES = {
  en: 'en-US',
  es: 'es-ES',
} as const;

/** A language identifier accepted by the application. */
export type Language = keyof typeof LANGUAGE_LOCALES;

/** The language used when no valid preference has been stored. */
export const DEFAULT_LANGUAGE: Language = 'en';

/** The cookie used to persist the user's language preference. */
export const LANGUAGE_COOKIE_NAME = 'simple-tasks-language';

/** The language cookie lifetime, expressed in seconds. */
export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Checks whether an unknown value is one of the supported language identifiers.
 *
 * @param value - Candidate language value from a cookie or form submission.
 * @returns Whether the value is a supported {@link Language}.
 */
export function isLanguage(value: unknown): value is Language {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(LANGUAGE_LOCALES, value)
  );
}

/**
 * Resolves an untrusted language value to a supported language.
 *
 * @param value - Candidate language value, possibly absent or malformed.
 * @returns The candidate when supported, otherwise {@link DEFAULT_LANGUAGE}.
 */
export function resolveLanguage(value: unknown): Language {
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}
