'use client';

import { I18nProvider as ReactAriaI18nProvider } from '@react-aria/i18n';

import { I18nProvider } from '@/lib/i18n/provider';
import { LANGUAGE_LOCALES, type Language } from '@/lib/i18n/config';

interface AppProvidersProps {
  children: React.ReactNode;
  language: Language;
}

/**
 * Supplies application and React Aria contexts with the server-selected locale.
 *
 * @param props - The application subtree and its persisted language.
 * @returns The subtree with translated copy and locale-aware accessibility text.
 */
export function AppProviders({
  children,
  language,
}: AppProvidersProps): React.JSX.Element {
  return (
    <I18nProvider language={language}>
      <ReactAriaI18nProvider locale={LANGUAGE_LOCALES[language]}>
        {children}
      </ReactAriaI18nProvider>
    </I18nProvider>
  );
}
