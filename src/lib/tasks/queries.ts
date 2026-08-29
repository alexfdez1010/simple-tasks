import { requireAuthenticated } from '@/lib/auth/session';
import { taskService } from '@/lib/tasks';
import type { BoardStatus } from '@/lib/tasks/types';

/** Returns the authenticated board snapshot for Server Components. */
export async function getBoard(): Promise<BoardStatus[]> {
  await requireAuthenticated();
  return taskService.listBoard();
}
