import { db } from '@/lib/db/client';
import { PrismaAutomationRepository } from '@/lib/automations/prisma-repository';
import { AutomationService } from '@/lib/automations/service';

export const automationService = new AutomationService(
  new PrismaAutomationRepository(db),
);

export type * from '@/lib/automations/types';
