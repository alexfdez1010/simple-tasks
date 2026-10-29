import type { PrismaClient } from '@/generated/prisma';
import {
  coordinatedTask,
  coordinatedTaskInclude,
} from '@/lib/coordination/read-model';

/** Reads a repeatable graph snapshot, retaining prerequisite ancestors outside the completed preview. */
export function readGraphSnapshot(client: PrismaClient) {
  return client.$transaction(
    async (transaction) => {
      const [active, completed, assignees, projects] = await Promise.all([
        transaction.task.findMany({
          where: { status: { isTerminal: false } },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          include: coordinatedTaskInclude,
        }),
        transaction.task.findMany({
          where: { status: { isTerminal: true } },
          orderBy: [{ completedAt: 'desc' }, { id: 'asc' }],
          take: 20,
          include: coordinatedTaskInclude,
        }),
        transaction.assignee.findMany({ orderBy: { name: 'asc' } }),
        transaction.project.findMany({ orderBy: { name: 'asc' } }),
      ]);
      const rows = new Map(
        [...active, ...completed].map((task) => [task.id, task]),
      );
      let parents = [...rows.values()].flatMap((row) =>
        row.dependencies.map((edge) => edge.dependsOnId),
      );
      while (parents.some((id) => !rows.has(id))) {
        const missing = [...new Set(parents.filter((id) => !rows.has(id)))];
        const ancestors = await transaction.task.findMany({
          where: { id: { in: missing } },
          include: coordinatedTaskInclude,
        });
        if (!ancestors.length) break;
        ancestors.forEach((row) => rows.set(row.id, row));
        parents = ancestors.flatMap((row) =>
          row.dependencies.map((edge) => edge.dependsOnId),
        );
      }
      return {
        tasks: [...rows.values()].map(coordinatedTask),
        assignees,
        projects,
      };
    },
    { isolationLevel: 'RepeatableRead' },
  );
}
