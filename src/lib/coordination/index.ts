import { db } from '@/lib/db/client';
import { PrismaCoordinationRepository } from '@/lib/coordination/repository';
import { CoordinationService } from '@/lib/coordination/service';

export const coordinationService = new CoordinationService(
  new PrismaCoordinationRepository(db),
);
