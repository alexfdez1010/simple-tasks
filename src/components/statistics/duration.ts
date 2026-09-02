import type { Language } from '@/lib/i18n/config';

import { getStatisticsCopy } from '@/components/statistics/copy';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Formats a mean duration using the largest useful localized unit. */
export function formatResolutionDuration(
  milliseconds: number | null,
  language: Language,
): string {
  if (milliseconds === null) {
    return getStatisticsCopy(language, 'notAvailable');
  }
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const [value, key] =
    milliseconds >= 2 * DAY
      ? [milliseconds / DAY, 'days' as const]
      : milliseconds >= HOUR
        ? [milliseconds / HOUR, 'hours' as const]
        : [milliseconds / MINUTE, 'minutes' as const];
  return getStatisticsCopy(language, key, {
    count: formatter.format(Math.max(0, value)),
  });
}
