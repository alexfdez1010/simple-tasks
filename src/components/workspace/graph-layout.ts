/** Minimal graph record shared by real tasks and disposable previews. */
export type GraphTask = {
  id: string;
  title: string;
  assignee: string;
  color: string;
  reviewer?: string;
  projectId: string;
  status: string;
  completed: boolean;
  ready: boolean;
  dependencyIds: string[];
};
export type GraphProject = { id: string; name: string };
export type GraphPosition = { x: number; y: number };
export const NODE_WIDTH = 244;
export const NODE_HEIGHT = 128;

/** Places an acyclic graph in dependency ranks and project lanes; missing parents remain unrendered. */
export function layoutGraph(tasks: GraphTask[], projects: GraphProject[]) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const rank = new Map<string, number>();
  /** Resolves the longest prerequisite path, tolerating corrupt legacy cycles without recursion overflow. */
  function depth(id: string, visiting = new Set<string>()): number {
    if (rank.has(id)) return rank.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const parents =
      byId.get(id)?.dependencyIds.filter((parent) => byId.has(parent)) ?? [];
    const value = parents.length
      ? 1 +
        Math.max(...parents.map((parent) => depth(parent, new Set(visiting))))
      : 0;
    rank.set(id, value);
    return value;
  }
  tasks.forEach((task) => depth(task.id));
  const positions = new Map<string, GraphPosition>();
  const lanes: { id: string; name: string; y: number; height: number }[] = [];
  let offset = 44;
  for (const project of projects) {
    const owned = tasks.filter((task) => task.projectId === project.id);
    if (!owned.length) continue;
    const rows = new Map<number, number>();
    for (const task of owned) {
      const column = rank.get(task.id) ?? 0;
      const row = rows.get(column) ?? 0;
      positions.set(task.id, {
        x: 40 + column * 314,
        y: offset + 38 + row * 152,
      });
      rows.set(column, row + 1);
    }
    const height = 50 + Math.max(...rows.values()) * 152;
    lanes.push({ ...project, y: offset, height });
    offset += height + 36;
  }
  return {
    positions,
    lanes,
    width: Math.max(
      560,
      ...[...positions.values()].map((p) => p.x + NODE_WIDTH + 40),
    ),
    height: Math.max(340, offset),
  };
}
