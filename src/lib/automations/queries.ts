import { automationService } from '@/lib/automations';
import type { AutomationDefinition } from '@/lib/automations/types';
import { requireAuthenticated } from '@/lib/auth/session';
import { propertyService } from '@/lib/properties';
import type { PropertyDefinition } from '@/lib/properties/types';
import { statusService } from '@/lib/statuses';
import type { Status } from '@/generated/prisma';

/** Data required by the dedicated automation workspace. */
export interface AutomationSnapshot {
  automations: AutomationDefinition[];
  properties: PropertyDefinition[];
  statuses: Status[];
}

/** Loads authenticated rule dependencies without fetching board tasks. */
export async function getAutomationSnapshot(): Promise<AutomationSnapshot> {
  await requireAuthenticated();
  await automationService.runDue();
  const [automations, properties, statuses] = await Promise.all([
    automationService.list(),
    propertyService.list(),
    statusService.list(),
  ]);
  return { automations, properties, statuses };
}
