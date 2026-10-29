import type { Prisma, Task, Status } from '@/generated/prisma';
import { conflict, notFound } from '@/lib/validation/errors';
import type { UpdateTaskInput } from '@/lib/tasks/types';

/** Validates an optional independent reviewer without inferring identity from a model name. */
export async function assertReviewer(
  transaction: Prisma.TransactionClient,
  reviewerId: string | null | undefined,
  assigneeId: string,
) {
  if (!reviewerId) return;
  if (reviewerId === assigneeId)
    throw conflict('Choose a reviewer different from the responsible party.');
  if (!(await transaction.assignee.findUnique({ where: { id: reviewerId } })))
    throw notFound('The reviewer');
}

/** Enforces explicit review submission and approval before workflow completion. */
export async function assertReviewTransition(
  transaction: Prisma.TransactionClient,
  id: string,
  target: Pick<Status, 'isTerminal' | 'workType'>,
) {
  const task = await transaction.task.findUniqueOrThrow({ where: { id } });
  if (target.isTerminal && task.reviewerId && task.reviewState !== 'APPROVED')
    throw conflict('This task needs reviewer approval before completion.');
  if (
    task.reviewState === 'PENDING' &&
    !target.isTerminal &&
    target.workType !== 'REVIEW'
  )
    throw conflict(
      'Resolve or revise the pending review before moving this task.',
    );
  if (
    !target.isTerminal &&
    target.workType === 'REVIEW' &&
    (!task.reviewerId || task.reviewState !== 'PENDING')
  )
    throw conflict('Submit the task for review before entering this state.');
}

/** Detects edits that invalidate a review; unchanged submitted fields do not trigger unnecessary review cycles. */
export async function reviewContentChanged(
  transaction: Prisma.TransactionClient,
  task: Task,
  input: UpdateTaskInput,
  assigneeId: string,
) {
  if (
    assigneeId !== task.assigneeId ||
    (input.reviewerId !== undefined && input.reviewerId !== task.reviewerId) ||
    (input.projectId !== undefined && input.projectId !== task.projectId) ||
    (input.title !== undefined && input.title !== task.title) ||
    (input.description !== undefined && input.description !== task.description)
  )
    return true;
  if (input.dependencyIds !== undefined) {
    const current = await transaction.taskDependency.findMany({
      where: { taskId: task.id },
      select: { dependsOnId: true },
    });
    if (
      JSON.stringify(current.map((edge) => edge.dependsOnId).sort()) !==
      JSON.stringify([...input.dependencyIds].sort())
    )
      return true;
  }
  if (input.propertyValues !== undefined) {
    const current = await transaction.taskPropertyValue.findMany({
      where: { taskId: task.id },
      include: { property: { select: { name: true } } },
    });
    const legacyIds = new Set(
      current
        .filter((value) =>
          ['responsable', 'assignee'].includes(
            value.property.name.toLowerCase(),
          ),
        )
        .map((value) => value.propertyId),
    );
    const stored = current
      .filter((value) => !legacyIds.has(value.propertyId))
      .map((value) => ({ propertyId: value.propertyId, value: value.value }))
      .sort((a, b) => a.propertyId.localeCompare(b.propertyId));
    const next = input.propertyValues
      .filter((value) => !legacyIds.has(value.propertyId))
      .toSorted((a, b) => a.propertyId.localeCompare(b.propertyId));
    if (JSON.stringify(stored) !== JSON.stringify(next)) return true;
  }
  return false;
}
