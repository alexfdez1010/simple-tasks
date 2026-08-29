import { BoardShell } from '@/components/board/board-shell';
import type { BoardStatus, PropertyDefinition } from '@/components/board/types';
import { getBoardSnapshot } from '@/lib/tasks/queries';

/** Builds the remount key that reconciles optimistic state after a refresh. */
function getSnapshotKey(
  statuses: BoardStatus[],
  properties: PropertyDefinition[],
): string {
  return JSON.stringify({
    statuses: [...statuses]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((status) => ({
        id: status.id,
        name: status.name,
        color: status.color,
        isTerminal: status.isTerminal,
        tasks: status.tasks.map((task) => ({
          id: task.id,
          statusId: task.statusId,
          position: task.position,
          updatedAt: task.updatedAt,
        })),
      })),
    properties: [...properties]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((property) => ({
        id: property.id,
        name: property.name,
        type: property.type,
        options: property.options,
      })),
  });
}

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
      statusId: task.statusId,
      position: task.position,
      updatedAt: task.updatedAt.toISOString(),
      propertyValues: task.propertyValues,
    })),
  }));
  const initialProperties: PropertyDefinition[] = snapshot.properties;

  return (
    <BoardShell
      key={getSnapshotKey(initialStatuses, initialProperties)}
      initialStatuses={initialStatuses}
      initialProperties={initialProperties}
    />
  );
}
