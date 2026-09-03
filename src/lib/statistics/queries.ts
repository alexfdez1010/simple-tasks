import { requireAuthenticated } from '@/lib/auth/session';
import { statisticsService } from '@/lib/statistics';
import type { StatisticsSnapshot } from '@/lib/statistics/types';

/** Returns authenticated configurable analytics from the complete task history. */
export async function getStatisticsSnapshot(): Promise<StatisticsSnapshot> {
  await requireAuthenticated();
  return statisticsService.getSnapshot();
}
