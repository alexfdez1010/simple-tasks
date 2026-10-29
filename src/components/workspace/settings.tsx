'use client';

import type { WorkspaceSnapshot } from '@/lib/coordination/snapshot';
import { BoardSettings } from '@/components/board/board-settings';
import {
  createStatusAction,
  updateStatusAction,
  deleteStatusAction,
  reorderStatusesAction,
} from '@/lib/statuses/actions';
import {
  createPropertyAction,
  updatePropertyAction,
  deletePropertyAction,
  reorderPropertiesAction,
} from '@/lib/properties/actions';
import type { ActionResult } from '@/lib/validation/action-result';

/** Moves a configured item one position, preserving complete membership for the existing order contracts. */
function reordered(
  items: { id: string }[],
  id: string,
  direction: -1 | 1,
): string[] {
  const ids = items.map((item) => item.id);
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index >= 0 && target >= 0 && target < ids.length)
    [ids[index], ids[target]] = [ids[target], ids[index]];
  return ids;
}

/** Retains workflow, custom-property and language management while the daily workspace moves to a graph. */
export function WorkspaceSettings({
  snapshot,
  onSaved,
}: {
  snapshot: WorkspaceSnapshot;
  onSaved: () => void;
}) {
  /** Refreshes the graph configuration after successful mutations, preserving normalized errors. */
  async function mutate<T>(operation: Promise<ActionResult<T>>) {
    const result = await operation;
    if (result.success) onSaved();
    return result;
  }
  return (
    <BoardSettings
      statuses={snapshot.statuses.map((status) => ({
        ...status,
        tasks: snapshot.tasks.filter((task) => task.statusId === status.id),
      }))}
      properties={snapshot.properties}
      onCreateStatus={(input) => mutate(createStatusAction(input))}
      onUpdateStatus={(id, input) =>
        mutate(updateStatusAction({ ...input, id }))
      }
      onDeleteStatus={(id) => mutate(deleteStatusAction(id))}
      onReorderStatus={(id, direction) =>
        mutate(
          reorderStatusesAction({
            statusIds: reordered(snapshot.statuses, id, direction),
          }),
        )
      }
      onCreateProperty={(input) => mutate(createPropertyAction(input))}
      onUpdateProperty={(id, input) =>
        mutate(updatePropertyAction({ ...input, id }))
      }
      onDeleteProperty={(id) => mutate(deletePropertyAction(id))}
      onReorderProperty={(id, direction) =>
        mutate(
          reorderPropertiesAction({
            propertyIds: reordered(snapshot.properties, id, direction),
          }),
        )
      }
    />
  );
}
