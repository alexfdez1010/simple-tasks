import type {
  CreateStatisticInput,
  ReorderStatisticsInput,
  StatisticDefinition,
  StatisticsCatalog,
  StatisticsSource,
  UpdateStatisticInput,
} from '@/lib/statistics/types';

/** Focused persistence contract for configurable statistics. */
export interface StatisticsRepository {
  /** Loads every task, dimension, and widget needed for calculation. */
  loadSource(): Promise<StatisticsSource>;
  /** Loads property and status metadata for definition validation. */
  loadCatalog(): Promise<StatisticsCatalog>;
  /** Lists persisted definitions in display order. */
  list(): Promise<StatisticDefinition[]>;
  /** Finds one definition by identifier. */
  findById(id: string): Promise<StatisticDefinition | null>;
  /** Appends one validated definition. */
  create(input: CreateStatisticInput): Promise<StatisticDefinition>;
  /** Updates one validated definition. */
  update(input: UpdateStatisticInput): Promise<StatisticDefinition>;
  /** Deletes one definition and compacts the remaining order. */
  delete(id: string): Promise<void>;
  /** Applies an exact complete widget order. */
  reorder(input: ReorderStatisticsInput): Promise<void>;
}
