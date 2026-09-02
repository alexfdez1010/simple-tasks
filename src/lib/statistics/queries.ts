import { requireAuthenticated } from '@/lib/auth/session';
import { statisticsService } from '@/lib/statistics';
import type { StatisticsSnapshot } from '@/lib/statistics/types';

/** Returns authenticated analytics calculated from every completed task. */
export async function getStatisticsSnapshot(): Promise<StatisticsSnapshot> {
  await requireAuthenticated();
  return statisticsService.getSnapshot();
}
