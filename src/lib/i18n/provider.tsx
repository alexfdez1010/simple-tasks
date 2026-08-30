'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';

import { LANGUAGE_LOCALES, type Language } from '@/lib/i18n/config';
import {
  translate,
  type TranslationKey,
  type TranslationValues,
} from '@/lib/i18n/translations';

interface I18nProviderProps {
  children: React.ReactNode;
  language: Language;
}

interface I18nContextValue {
  language: Language;
  locale: string;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Provides the selected language, locale, and typed translation function.
 *
 * @param props - The server-resolved language and application subtree.
 * @returns The subtree backed by the application translation context.
 */
export function I18nProvider({
  children,
  language,
}: I18nProviderProps): React.JSX.Element {
  const locale = LANGUAGE_LOCALES[language];
  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues): string =>
      translate(language, key, values),
    [language],
  );
  const value = useMemo(() => ({ language, locale, t }), [language, locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Reads the nearest application translation context.
 *
 * @returns The active language, locale, and translation function.
 * @throws If called outside of an {@link I18nProvider}.
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider.');
  }
  return context;
}
