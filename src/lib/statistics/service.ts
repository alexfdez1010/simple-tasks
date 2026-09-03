import { buildStatisticsSnapshot } from '@/lib/statistics/aggregation';
import type { StatisticsRepository } from '@/lib/statistics/repository';
import type {
  CreateStatisticInput,
  ReorderStatisticsInput,
  StatisticDefinition,
  StatisticsSnapshot,
  UpdateStatisticInput,
} from '@/lib/statistics/types';
import { idSchema } from '@/lib/validation/common';
import { notFound } from '@/lib/validation/errors';
import {
  createStatisticSchema,
  mergeStatisticUpdate,
  normalizeStatisticDefinition,
  reorderStatisticsSchema,
  updateStatisticSchema,
} from '@/lib/validation/statistics';

/** Statistic use cases shared by the authenticated UI and MCP transport. */
export class StatisticsService {
  /** Injects the focused statistics persistence abstraction. */
  constructor(private readonly repository: StatisticsRepository) {}

  /** Loads source records and returns their presentation-safe projection. */
  async getSnapshot(now?: Date): Promise<StatisticsSnapshot> {
    return buildStatisticsSnapshot(await this.repository.loadSource(), now);
  }

  /** Lists persisted widget definitions in display order. */
  async list(): Promise<StatisticDefinition[]> {
    const [definitions, catalog] = await Promise.all([
      this.repository.list(),
      this.repository.loadCatalog(),
    ]);
    const statusIds = new Set(catalog.statuses.map((status) => status.id));
    return definitions.map((definition) => ({
      ...definition,
      statusIds: definition.statusIds.filter((id) => statusIds.has(id)),
    }));
  }

  /** Validates references and appends one widget definition. */
  async create(input: CreateStatisticInput): Promise<StatisticDefinition> {
    const parsed = createStatisticSchema.parse(input) as CreateStatisticInput;
    const catalog = await this.repository.loadCatalog();
    return this.repository.create(
      normalizeStatisticDefinition(
        parsed,
        catalog.properties,
        catalog.statuses,
      ),
    );
  }

  /** Merges, validates, and persists one partial widget edit. */
  async update(input: UpdateStatisticInput): Promise<StatisticDefinition> {
    const parsed = updateStatisticSchema.parse(input) as UpdateStatisticInput;
    const [current, catalog] = await Promise.all([
      this.repository.findById(parsed.id),
      this.repository.loadCatalog(),
    ]);
    if (!current) throw notFound('The statistic');
    const availableStatusIds = new Set(catalog.statuses.map(({ id }) => id));
    const safeCurrent = {
      ...current,
      statusIds: current.statusIds.filter((id) => availableStatusIds.has(id)),
    };
    const normalized = normalizeStatisticDefinition(
      mergeStatisticUpdate(safeCurrent, parsed),
      catalog.properties,
      catalog.statuses,
    );
    return this.repository.update({ id: parsed.id, ...normalized });
  }

  /** Deletes one widget definition. */
  delete(id: string): Promise<void> {
    return this.repository.delete(idSchema.parse(id));
  }

  /** Validates and applies one complete widget order. */
  reorder(input: ReorderStatisticsInput): Promise<void> {
    return this.repository.reorder(reorderStatisticsSchema.parse(input));
  }
}
