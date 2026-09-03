import { StatisticDateRange } from '@/generated/prisma';
import type { Language } from '@/lib/i18n/config';

const labels: Record<Language, Record<StatisticDateRange, string>> = {
  en: {
    ALL_TIME: 'All time',
    TODAY: 'Today',
    LAST_7_DAYS: 'Last 7 days',
    LAST_30_DAYS: 'Last 30 days',
    LAST_90_DAYS: 'Last 90 days',
    THIS_WEEK: 'This week',
    THIS_MONTH: 'This month',
    THIS_QUARTER: 'This quarter',
    THIS_YEAR: 'This year',
    NEXT_7_DAYS: 'Next 7 days',
    NEXT_30_DAYS: 'Next 30 days',
  },
  es: {
    ALL_TIME: 'Todo el historial',
    TODAY: 'Hoy',
    LAST_7_DAYS: 'Últimos 7 días',
    LAST_30_DAYS: 'Últimos 30 días',
    LAST_90_DAYS: 'Últimos 90 días',
    THIS_WEEK: 'Esta semana',
    THIS_MONTH: 'Este mes',
    THIS_QUARTER: 'Este trimestre',
    THIS_YEAR: 'Este año',
    NEXT_7_DAYS: 'Próximos 7 días',
    NEXT_30_DAYS: 'Próximos 30 días',
  },
};

/** Returns the localized field label for relative statistic periods. */
export function getDateRangeFieldLabel(language: Language): string {
  return language === 'es' ? 'Periodo' : 'Period';
}

/** Returns the localized label for one relative statistic period. */
export function getDateRangeLabel(
  language: Language,
  range: StatisticDateRange,
): string {
  return labels[language][range];
}

/** Creates localized selector rows for every supported relative period. */
export function getDateRangeOptions(
  language: Language,
): Array<{ id: StatisticDateRange; label: string }> {
  return Object.values(StatisticDateRange).map((range) => ({
    id: range,
    label: getDateRangeLabel(language, range),
  }));
}
