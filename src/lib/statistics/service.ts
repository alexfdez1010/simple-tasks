import { buildStatisticsSnapshot } from '@/lib/statistics/aggregation';
import type { StatisticsRepository } from '@/lib/statistics/repository';
import type { StatisticsSnapshot } from '@/lib/statistics/types';

/** Read-only statistics use cases for the authenticated web application. */
export class StatisticsService {
  /** Injects the persistence abstraction used by analytics. */
  constructor(private readonly repository: StatisticsRepository) {}

  /** Loads source records and returns their presentation-safe projection. */
  async getSnapshot(): Promise<StatisticsSnapshot> {
    return buildStatisticsSnapshot(await this.repository.loadSource());
  }
}
