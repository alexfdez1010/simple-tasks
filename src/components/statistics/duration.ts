import type { Language } from '@/lib/i18n/config';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Formats a mean duration using the largest useful localized unit. */
export function formatResolutionDuration(
  milliseconds: number | null,
  language: Language,
): string {
  if (milliseconds === null) {
    return language === 'es' ? 'No disponible' : 'Not available';
  }
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const [value, unit] =
    milliseconds >= 2 * DAY
      ? [milliseconds / DAY, 'day' as const]
      : milliseconds >= HOUR
        ? [milliseconds / HOUR, 'hour' as const]
        : [milliseconds / MINUTE, 'minute' as const];
  const normalized = Math.max(0, value);
  const labels =
    language === 'es'
      ? { day: 'día', hour: 'hora', minute: 'minuto' }
      : { day: 'day', hour: 'hour', minute: 'minute' };
  return `${formatter.format(normalized)} ${labels[unit]}${normalized === 1 ? '' : 's'}`;
}
