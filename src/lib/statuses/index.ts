import { db } from '@/lib/db/client';
import { PrismaStatusRepository } from '@/lib/statuses/prisma-repository';
import { StatusService } from '@/lib/statuses/service';

export const statusService = new StatusService(new PrismaStatusRepository(db));

export type * from '@/lib/statuses/types';
