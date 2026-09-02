import { db } from '@/lib/db/client';
import { PrismaStatisticsRepository } from '@/lib/statistics/prisma-repository';
import { StatisticsService } from '@/lib/statistics/service';

export const statisticsService = new StatisticsService(
  new PrismaStatisticsRepository(db),
);

export type * from '@/lib/statistics/types';
