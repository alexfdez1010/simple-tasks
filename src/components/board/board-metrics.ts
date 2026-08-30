import type { BoardStatus } from '@/components/board/types';

export interface BoardMetrics {
  activeCount: number;
  completedCount: number;
  completionPercentage: number;
  visibleCount: number;
}

/**
 * Summarizes the visible board without assuming terminal columns are exhaustive.
 *
 * @param statuses - Ordered workflow states and their currently loaded tasks.
 * @returns Active, completed, visible, and percentage values for the toolbar.
 */
export function getBoardMetrics(statuses: BoardStatus[]): BoardMetrics {
  let activeCount = 0;
  let completedCount = 0;

  for (const status of statuses) {
    if (status.isTerminal) completedCount += status.tasks.length;
    else activeCount += status.tasks.length;
  }

  const visibleCount = activeCount + completedCount;
  const completionPercentage =
    visibleCount === 0 ? 0 : Math.round((completedCount / visibleCount) * 100);

  return {
    activeCount,
    completedCount,
    completionPercentage,
    visibleCount,
  };
}
