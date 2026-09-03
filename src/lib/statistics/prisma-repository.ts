import { Prisma, type PrismaClient } from '@/generated/prisma';
import { runSerializable } from '@/lib/db/transaction';
import {
  serializeProperty,
  serializeTaskPropertyValue,
} from '@/lib/properties/serialization';
import { MAX_STATISTICS } from '@/lib/statistics/limits';
import type { StatisticsRepository } from '@/lib/statistics/repository';
import { serializeStatistic } from '@/lib/statistics/serialization';
import type {
  CreateStatisticInput,
  ReorderStatisticsInput,
  StatisticDefinition,
  StatisticsCatalog,
  StatisticsSource,
  UpdateStatisticInput,
} from '@/lib/statistics/types';
import { conflict, notFound } from '@/lib/validation/errors';

/** Rewrites statistic positions according to one complete ordered id list. */
async function resequenceStatistics(
  client: Pick<PrismaClient, 'statisticWidget'>,
  ids: string[],
): Promise<void> {
  await Promise.all(
    ids.map((id, position) =>
      client.statisticWidget.update({ where: { id }, data: { position } }),
    ),
  );
}

/** Prisma-backed configurable-statistics persistence. */
export class PrismaStatisticsRepository implements StatisticsRepository {
  /** Injects the process-level Prisma client. */
  constructor(private readonly client: PrismaClient) {}

  /** Loads property definitions and workflow states concurrently. */
  async loadCatalog(): Promise<StatisticsCatalog> {
    const [properties, statuses] = await Promise.all([
      this.client.taskPropertyDefinition.findMany({
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      }),
      this.client.status.findMany({
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return { properties: properties.map(serializeProperty), statuses };
  }

  /** Loads the complete uncapped task history and configurable dimensions. */
  async loadSource(): Promise<StatisticsSource> {
    const [catalog, statistics, tasks] = await Promise.all([
      this.loadCatalog(),
      this.list(),
      this.client.task.findMany({ include: { propertyValues: true } }),
    ]);
    return {
      ...catalog,
      statistics,
      tasks: tasks.map((task) => ({
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        dueDate: task.dueDate,
        id: task.id,
        propertyValues: task.propertyValues.map(serializeTaskPropertyValue),
        statusId: task.statusId,
        updatedAt: task.updatedAt,
      })),
    };
  }

  /** Lists definitions in stable display order. */
  async list(): Promise<StatisticDefinition[]> {
    const statistics = await this.client.statisticWidget.findMany({
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    return statistics.map(serializeStatistic);
  }

  /** Finds one definition by identifier. */
  async findById(id: string): Promise<StatisticDefinition | null> {
    const statistic = await this.client.statisticWidget.findUnique({
      where: { id },
    });
    return statistic ? serializeStatistic(statistic) : null;
  }

  /** Appends one definition while enforcing the canvas size limit. */
  async create(input: CreateStatisticInput): Promise<StatisticDefinition> {
    const statistic = await runSerializable(
      this.client,
      async (transaction) => {
        const count = await transaction.statisticWidget.count();
        if (count >= MAX_STATISTICS) {
          throw conflict(
            `The canvas supports at most ${MAX_STATISTICS} statistics.`,
          );
        }
        const aggregate = await transaction.statisticWidget.aggregate({
          _max: { position: true },
        });
        return transaction.statisticWidget.create({
          data: { ...input, position: (aggregate._max.position ?? -1) + 1 },
        });
      },
    );
    return serializeStatistic(statistic);
  }

  /** Updates one existing definition. */
  async update(input: UpdateStatisticInput): Promise<StatisticDefinition> {
    const { id, ...data } = input;
    try {
      return serializeStatistic(
        await this.client.statisticWidget.update({ where: { id }, data }),
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw notFound('The statistic');
      }
      throw error;
    }
  }

  /** Deletes one definition and compacts the remaining order. */
  async delete(id: string): Promise<void> {
    await runSerializable(this.client, async (transaction) => {
      const result = await transaction.statisticWidget.deleteMany({
        where: { id },
      });
      if (!result.count) throw notFound('The statistic');
      const remaining = await transaction.statisticWidget.findMany({
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });
      await resequenceStatistics(
        transaction,
        remaining.map((item) => item.id),
      );
    });
  }

  /** Applies exact ordered membership to the statistics canvas. */
  async reorder(input: ReorderStatisticsInput): Promise<void> {
    await runSerializable(this.client, async (transaction) => {
      const rows = await transaction.statisticWidget.findMany({
        select: { id: true },
      });
      const expected = rows.map((row) => row.id).sort();
      const received = [...new Set(input.statisticIds)].sort();
      if (
        expected.length !== received.length ||
        expected.some((id, index) => id !== received[index])
      ) {
        throw conflict('The order must include every statistic exactly once.');
      }
      await resequenceStatistics(transaction, input.statisticIds);
    });
  }
}
