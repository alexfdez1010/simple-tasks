import { db } from '@/lib/db/client';
import { PrismaPropertyRepository } from '@/lib/properties/prisma-repository';
import { PropertyService } from '@/lib/properties/service';

export const propertyService = new PropertyService(
  new PrismaPropertyRepository(db),
);

export type * from '@/lib/properties/types';
