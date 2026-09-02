import { TaskPropertyType, type PrismaClient } from '@/generated/prisma';
import {
  deserializeOptions,
  serializeTaskPropertyValue,
} from '@/lib/properties/serialization';
import type { StatisticsRepository } from '@/lib/statistics/repository';
import type { StatisticsSource } from '@/lib/statistics/types';

/** Prisma-backed reader for completed-task analytics. */
export class PrismaStatisticsRepository implements StatisticsRepository {
  /** Injects the process-level Prisma client. */
  constructor(private readonly client: PrismaClient) {}

  /** Loads uncapped completions and selectable definitions concurrently. */
  async loadSource(): Promise<StatisticsSource> {
    const [tasks, properties] = await Promise.all([
      this.client.task.findMany({
        where: { completedAt: { not: null } },
        select: {
          completedAt: true,
          createdAt: true,
          propertyValues: { select: { propertyId: true, value: true } },
        },
      }),
      this.client.taskPropertyDefinition.findMany({
        where: {
          type: {
            in: [TaskPropertyType.SELECT, TaskPropertyType.MULTI_SELECT],
          },
        },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return {
      completedTasks: tasks.flatMap((task) =>
        task.completedAt
          ? [
              {
                completedAt: task.completedAt,
                createdAt: task.createdAt,
                propertyValues: task.propertyValues.map(
                  serializeTaskPropertyValue,
                ),
              },
            ]
          : [],
      ),
      properties: properties.map((property) => ({
        id: property.id,
        name: property.name,
        options: deserializeOptions(property.options),
        position: property.position,
        type:
          property.type === TaskPropertyType.SELECT
            ? TaskPropertyType.SELECT
            : TaskPropertyType.MULTI_SELECT,
      })),
    };
  }
}
