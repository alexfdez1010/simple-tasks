import { requireAuthenticated } from '@/lib/auth/session';
import { propertyService } from '@/lib/properties';
import { taskService } from '@/lib/tasks';
import type { BoardSnapshot, BoardStatus } from '@/lib/tasks/types';

/** Returns the authenticated board snapshot for Server Components. */
export async function getBoard(): Promise<BoardStatus[]> {
  await requireAuthenticated();
  return taskService.listBoard();
}

/** Returns definitions and the authenticated board as one UI snapshot. */
export async function getBoardSnapshot(): Promise<BoardSnapshot> {
  await requireAuthenticated();
  const [statuses, properties] = await Promise.all([
    taskService.listBoard(),
    propertyService.list(),
  ]);
  return { statuses, properties };
}
