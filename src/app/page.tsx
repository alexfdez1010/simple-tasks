import { BoardShell } from '@/components/board/board-shell';
import type { BoardStatus, PropertyDefinition } from '@/components/board/types';
import { getBoardSnapshot } from '@/lib/tasks/queries';

/** Ensures every board request reads the latest persisted workflow state. */
export const dynamic = 'force-dynamic';

/**
 * Loads and renders the authenticated task board.
 *
 * @returns The server-rendered board shell with serializable initial data.
 */
export default async function Home() {
  const snapshot = await getBoardSnapshot();
  const initialStatuses: BoardStatus[] = snapshot.statuses.map((status) => ({
    id: status.id,
    name: status.name,
    color: status.color,
    position: status.position,
    isTerminal: status.isTerminal,
    tasks: status.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      completedAt: task.completedAt?.toISOString() ?? null,
      statusId: task.statusId,
      position: task.position,
      updatedAt: task.updatedAt.toISOString(),
      propertyValues: task.propertyValues,
    })),
  }));
  const initialProperties: PropertyDefinition[] = snapshot.properties;
  return (
    <BoardShell
      initialStatuses={initialStatuses}
      initialProperties={initialProperties}
    />
  );
}
