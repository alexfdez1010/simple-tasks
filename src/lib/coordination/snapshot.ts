import { coordinationService } from '@/lib/coordination';
import { statusService } from '@/lib/statuses';
import { propertyService } from '@/lib/properties';

/** Converts server dates recursively into the JSON representation used by polling and initial rendering. */
export type JsonDates<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? JsonDates<U>[]
    : T extends object
      ? { [K in keyof T]: JsonDates<T[K]> }
      : T;
export type WorkspaceSnapshot = JsonDates<
  Awaited<ReturnType<typeof getWorkspaceSnapshot>>
>;
export type WorkspaceTask = WorkspaceSnapshot['tasks'][number];

/** Loads graph data and existing configuration through their shared application services. */
export async function getWorkspaceSnapshot() {
  const [snapshot, statuses, properties] = await Promise.all([
    coordinationService.snapshot(),
    statusService.list(),
    propertyService.list(),
  ]);
  return { ...snapshot, statuses, properties };
}

/** Serializes the initial server snapshot exactly like the polling response, including nested dates. */
export function serializeWorkspace(
  snapshot: Awaited<ReturnType<typeof getWorkspaceSnapshot>>,
): WorkspaceSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as WorkspaceSnapshot;
}
