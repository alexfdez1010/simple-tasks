'use client';

import { I18nProvider } from '@react-aria/i18n';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Supplies application-wide client contexts with a fixed English locale.
 *
 * @param props - The application subtree rendered inside shared providers.
 * @returns The subtree with deterministic English HeroUI accessibility text.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <I18nProvider locale="en-US">{children}</I18nProvider>;
}
