import type { StatisticsSource } from '@/lib/statistics/types';

/** Focused persistence contract for statistics source data. */
export interface StatisticsRepository {
  /** Loads every completion and every selectable property in display order. */
  loadSource(): Promise<StatisticsSource>;
}
