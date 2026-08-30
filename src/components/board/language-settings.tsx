'use client';

import { Description, Label, Radio, RadioGroup } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { isLanguage, type Language } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/provider';
import { setLanguageAction } from '@/lib/i18n/server';

/**
 * Renders the controlled language preference and persists changes in a transition.
 *
 * @returns A localized, keyboard-accessible language selection group.
 */
export function LanguageSettings(): React.JSX.Element {
  const router = useRouter();
  const { language, t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  /** Persists a supported language and refreshes the server-resolved context. */
  function handleLanguageChange(value: string): void {
    if (!isLanguage(value) || value === language || isPending) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await setLanguageAction(value);
        if (!result.success) {
          setError(t('settings.languageChangeError'));
          return;
        }
        router.refresh();
      } catch {
        setError(t('settings.languageChangeError'));
      }
    });
  }

  /** Returns the localized name for a language option. */
  function languageLabel(value: Language): string {
    return t(value === 'en' ? 'settings.english' : 'settings.spanish');
  }

  return (
    <RadioGroup
      className="gap-3"
      isDisabled={isPending}
      name="application-language"
      onChange={handleLanguageChange}
      value={language}
      variant="secondary"
    >
      <Label>{t('settings.language')}</Label>
      <Description>{t('settings.languageDescription')}</Description>
      {(['en', 'es'] as const).map((value) => (
        <Radio
          className="min-h-11 rounded-xl px-3 py-2"
          key={value}
          value={value}
        >
          <Radio.Content className="min-h-11">
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {languageLabel(value)}
          </Radio.Content>
        </Radio>
      ))}
      {error ? (
        <Description className="text-danger">{error}</Description>
      ) : null}
    </RadioGroup>
  );
}
