import type { Metadata } from 'next';

import { StatisticsDashboard } from '@/components/statistics/statistics-dashboard';
import { getStatisticsCopy } from '@/components/statistics/copy';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { getStatisticsSnapshot } from '@/lib/statistics/queries';

/** Ensures analytics always reflect the latest completed work. */
export const dynamic = 'force-dynamic';

/** Builds localized metadata for the protected statistics route. */
export async function generateMetadata(): Promise<Metadata> {
  const language = await getCurrentLanguage();
  return {
    description: getStatisticsCopy(language, 'subtitle'),
    title: getStatisticsCopy(language, 'heading'),
  };
}

/** Loads and renders the authenticated analytics dashboard. */
export default async function StatisticsPage(): Promise<React.JSX.Element> {
  const snapshot = await getStatisticsSnapshot();
  return <StatisticsDashboard snapshot={snapshot} />;
}
