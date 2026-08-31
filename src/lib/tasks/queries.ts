import { requireAuthenticated } from '@/lib/auth/session';
import { automationService } from '@/lib/automations';
import { propertyService } from '@/lib/properties';
import { taskService } from '@/lib/tasks';
import type { BoardSnapshot, BoardStatus } from '@/lib/tasks/types';

/** Returns the authenticated board snapshot for Server Components. */
export async function getBoard(): Promise<BoardStatus[]> {
  await requireAuthenticated();
  await automationService.runDue();
  return taskService.listBoard();
}

/** Returns definitions and the authenticated board as one UI snapshot. */
export async function getBoardSnapshot(): Promise<BoardSnapshot> {
  await requireAuthenticated();
  await automationService.runDue();
  const [statuses, properties, automations] = await Promise.all([
    taskService.listBoard(),
    propertyService.list(),
    automationService.list(),
  ]);
  return { statuses, properties, automations };
}
