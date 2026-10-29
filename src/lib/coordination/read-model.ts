import type { Prisma } from '@/generated/prisma';
import { serializeTaskWithProperties } from '@/lib/tasks/serialization';

export const coordinatedTaskInclude = {
  status: true,
  assignee: true,
  reviewer: true,
  project: true,
  propertyValues: true,
  dependencies: {
    orderBy: { dependsOnId: 'asc' },
    include: { dependsOn: { include: { status: true, assignee: true } } },
  },
  dependents: { select: { taskId: true }, orderBy: { taskId: 'asc' } },
} satisfies Prisma.TaskInclude;
export type CoordinatedRow = Prisma.TaskGetPayload<{
  include: typeof coordinatedTaskInclude;
}>;
export type CoordinatedTask = ReturnType<typeof coordinatedTask>;

/** Projects persisted relationships into a finite task response and derives readiness from current prerequisites. */
export function coordinatedTask(row: CoordinatedRow) {
  const { dependencies, dependents, ...task } = row;
  const pending = dependencies
    .filter((edge) => !edge.dependsOn.status.isTerminal)
    .map((edge) => edge.dependsOnId);
  return {
    ...serializeTaskWithProperties(task),
    status: row.status,
    assignee: row.assignee,
    reviewer: row.reviewer,
    project: row.project,
    dependencyIds: dependencies.map((edge) => edge.dependsOnId),
    dependentIds: dependents.map((edge) => edge.taskId),
    prerequisites: dependencies.map(({ dependsOn }) => ({
      id: dependsOn.id,
      title: dependsOn.title,
      description: dependsOn.description,
      assigneeId: dependsOn.assigneeId,
      assignee: dependsOn.assignee,
      status: dependsOn.status,
      projectId: dependsOn.projectId,
      completedAt: dependsOn.completedAt,
    })),
    blockingDependencyIds: pending,
    ready:
      !row.status.isTerminal &&
      row.status.workType === 'READY' &&
      pending.length === 0,
  };
}
