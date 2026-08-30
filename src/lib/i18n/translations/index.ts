import type { Language } from '@/lib/i18n/config';
import { en } from '@/lib/i18n/translations/en';
import { es } from '@/lib/i18n/translations/es';

/** Keys shared by every translation dictionary. */
export type TranslationKey = keyof typeof en;

/** Values accepted by named placeholders in translated messages. */
export type TranslationValues = Readonly<Record<string, string | number>>;

/** Complete, strongly typed application translation catalog. */
export const translations = { en, es } as const satisfies Record<
  Language,
  Record<TranslationKey, string>
>;

const PLACEHOLDER_PATTERN = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;

/**
 * Formats one translated message with safe named-placeholder replacement.
 *
 * @param language - The requested language; English is the default catalog.
 * @param key - A compile-time checked translation key.
 * @param values - Optional string or number values for named placeholders.
 * @returns The translated message, preserving unknown placeholders safely.
 * @remarks This function is pure and does not mutate the catalog or values.
 */
export function translate(
  language: Language,
  key: TranslationKey,
  values: TranslationValues = {},
): string {
  const message = translations[language]?.[key] ?? translations.en[key];
  return message.replace(PLACEHOLDER_PATTERN, (placeholder, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return placeholder;
    return String(values[name]);
  });
}

export { en } from '@/lib/i18n/translations/en';
export { es } from '@/lib/i18n/translations/es';
export type { Language } from '@/lib/i18n/config';
