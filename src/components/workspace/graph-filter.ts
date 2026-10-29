import type { WorkspaceTask } from '@/lib/coordination/snapshot';

/** Filters primary work while retaining every prerequisite ancestor needed to explain its graph. */
export function filterGraphTasks(
  tasks: WorkspaceTask[],
  filters: {
    projectId: string;
    assigneeId: string;
    search: string;
    showCompleted: boolean;
  },
) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const selected = tasks.filter(
    (task) =>
      (filters.projectId === 'all' || task.projectId === filters.projectId) &&
      (filters.assigneeId === 'all' ||
        task.assigneeId === filters.assigneeId) &&
      (filters.showCompleted || !task.status.isTerminal) &&
      task.title
        .toLocaleLowerCase()
        .includes(filters.search.toLocaleLowerCase()),
  );
  const included = new Set(selected.map((task) => task.id));
  const pending = [...selected];
  while (pending.length)
    for (const id of pending.pop()!.dependencyIds) {
      const parent = byId.get(id);
      if (!parent || included.has(id)) continue;
      included.add(id);
      pending.push(parent);
    }
  return tasks.filter((task) => included.has(task.id));
}
