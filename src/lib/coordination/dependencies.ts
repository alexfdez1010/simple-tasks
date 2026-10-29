import type { Prisma, Status } from '@/generated/prisma';
import { conflict, notFound } from '@/lib/validation/errors';

/** Validates the proposed outgoing prerequisites against all stored edges, rejecting cycles before writing. */
export async function replaceDependencies(
  transaction: Prisma.TransactionClient,
  taskId: string,
  ids: string[],
): Promise<void> {
  if (ids.includes(taskId)) throw conflict('A task cannot depend on itself.');
  if (new Set(ids).size !== ids.length)
    throw conflict('Dependencies must be unique.');
  if (
    (await transaction.task.count({ where: { id: { in: ids } } })) !==
    ids.length
  )
    throw notFound('One or more dependency tasks');
  const edges = await transaction.taskDependency.findMany({
    where: { taskId: { not: taskId } },
  });
  const graph = new Map<string, string[]>();
  for (const edge of edges)
    graph.set(edge.taskId, [
      ...(graph.get(edge.taskId) ?? []),
      edge.dependsOnId,
    ]);
  const pending = [...ids];
  const visited = new Set<string>();
  while (pending.length) {
    const id = pending.pop()!;
    if (id === taskId) throw conflict('Dependencies cannot form a cycle.');
    if (visited.has(id)) continue;
    visited.add(id);
    pending.push(...(graph.get(id) ?? []));
  }
  await transaction.taskDependency.deleteMany({ where: { taskId } });
  if (ids.length)
    await transaction.taskDependency.createMany({
      data: ids.map((dependsOnId) => ({ taskId, dependsOnId })),
    });
}

/** Rejects starting or completing a task until every prerequisite is in a terminal workflow state. */
export async function assertDependenciesSatisfied(
  transaction: Prisma.TransactionClient,
  taskId: string,
  target: Pick<Status, 'isTerminal' | 'workType'>,
): Promise<void> {
  if (!target.isTerminal && target.workType !== 'WORKING') return;
  const pending = await transaction.taskDependency.count({
    where: { taskId, dependsOn: { status: { isTerminal: false } } },
  });
  if (pending)
    throw conflict(
      'Complete the prerequisite tasks before starting or completing this task.',
    );
}
