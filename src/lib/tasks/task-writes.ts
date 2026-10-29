import { recordTaskEvent } from '@/lib/webhooks/outbox';
import {
  assertReviewer,
  assertReviewTransition,
  reviewContentChanged,
} from '@/lib/coordination/review-guards';
import { assertProject } from '@/lib/coordination/references';
import type { PrismaClient } from '@/generated/prisma';
import { runSerializable } from '@/lib/db/transaction';
import {
  replaceDependencies,
  assertDependenciesSatisfied,
} from '@/lib/coordination/dependencies';
import {
  mirrorLegacyAssignee,
  resolveAssignee,
} from '@/lib/coordination/ownership';
import { persistTaskPropertyValues } from '@/lib/properties/value-persistence';
import {
  editTaskPlacement,
  type EditableTaskFields,
} from '@/lib/tasks/task-placement';
import { conflict, notFound } from '@/lib/validation/errors';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/tasks/types';

/** Creates an assigned task and its complete prerequisite set in one serializable transaction. */
export function createAssignedTask(
  client: PrismaClient,
  input: CreateTaskInput,
) {
  return runSerializable(client, async (transaction) => {
    let status = input.statusId
      ? await transaction.status.findUnique({ where: { id: input.statusId } })
      : await transaction.status.findFirst({
          where: { isTerminal: false, workType: 'READY' },
          orderBy: { position: 'asc' },
        });
    if (!status && !input.statusId)
      status = await transaction.status.findFirst({
        orderBy: { position: 'asc' },
      });
    if (!status) throw notFound('The status');
    const assigneeId = await resolveAssignee(
      transaction,
      input.assigneeId,
      input.propertyValues,
    );
    await assertReviewer(transaction, input.reviewerId, assigneeId);
    const projectId = input.projectId ?? 'project-general';
    await assertProject(transaction, projectId);
    const aggregate = await transaction.task.aggregate({
      where: { statusId: status.id },
      _max: { position: true },
    });
    const task = await transaction.task.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate instanceof Date ? input.dueDate : null,
        statusId: status.id,
        position: (aggregate._max.position ?? -1) + 1,
        completedAt: status.isTerminal ? new Date() : null,
        assigneeId,
        reviewerId: input.reviewerId,
        projectId,
      },
    });
    if (input.propertyValues?.length)
      await persistTaskPropertyValues(
        transaction,
        task.id,
        input.propertyValues,
        true,
      );
    await mirrorLegacyAssignee(transaction, task.id, assigneeId);
    if (input.dependencyIds)
      await replaceDependencies(transaction, task.id, input.dependencyIds);
    await assertDependenciesSatisfied(transaction, task.id, status);
    await assertReviewTransition(transaction, task.id, status);

    await recordTaskEvent(transaction, 'task.created', task.id);
    return task;
  });
}

/** Atomically edits task ownership, project, prerequisites and optional workflow placement. */
export function updateAssignedTask(
  client: PrismaClient,
  input: UpdateTaskInput,
) {
  return runSerializable(client, async (transaction) => {
    const task = await transaction.task.findUnique({
      where: { id: input.id },
      include: { status: true },
    });
    if (!task) throw notFound('The task');
    if (
      input.expectedUpdatedAt &&
      input.expectedUpdatedAt !== task.updatedAt.toISOString()
    )
      throw conflict(
        'The task changed since it was read. Reload it before saving.',
      );
    const assigneeId = await resolveAssignee(
      transaction,
      input.assigneeId,
      input.propertyValues,
      task.assigneeId,
    );
    await assertReviewer(
      transaction,
      input.reviewerId === undefined ? task.reviewerId : input.reviewerId,
      assigneeId,
    );
    const invalidated = await reviewContentChanged(
      transaction,
      task,
      input,
      assigneeId,
    );
    if (input.projectId) await assertProject(transaction, input.projectId);
    if (input.dependencyIds !== undefined)
      await replaceDependencies(transaction, task.id, input.dependencyIds);
    let target = input.statusId
      ? await transaction.status.findUnique({ where: { id: input.statusId } })
      : task.status;
    if (!target) throw notFound('The status');
    if (
      invalidated &&
      ['PENDING', 'APPROVED'].includes(task.reviewState) &&
      (!input.statusId || input.statusId === task.statusId)
    ) {
      target = await transaction.status.findFirst({
        where: { isTerminal: false, workType: 'READY' },
        orderBy: { position: 'asc' },
      });
      if (!target)
        throw conflict(
          'Configure a ready workflow state before editing reviewed work.',
        );
    }
    if (
      invalidated &&
      target.isTerminal &&
      (input.reviewerId === undefined ? task.reviewerId : input.reviewerId)
    )
      throw conflict('This task needs reviewer approval before completion.');
    if (invalidated)
      await transaction.task.update({
        where: { id: task.id },
        data: {
          reviewState: 'NOT_REQUESTED',
          reviewNote: null,
          reviewedAt: null,
          completedAt: target.isTerminal ? task.completedAt : null,
        },
      });
    await assertDependenciesSatisfied(transaction, task.id, target);
    const edits: EditableTaskFields = {
      title: input.title,
      description: input.description,
      dueDate:
        input.dueDate instanceof Date || input.dueDate === null
          ? input.dueDate
          : undefined,
      assigneeId,
      reviewerId: input.reviewerId,
      projectId: input.projectId,
    };
    await (target.id === task.statusId && input.index === undefined
      ? await transaction.task.update({ where: { id: task.id }, data: edits })
      : await editTaskPlacement(
          transaction,
          task,
          target,
          input.index ?? 0,
          edits,
        ));
    await assertReviewTransition(transaction, task.id, target);
    if (input.propertyValues !== undefined)
      await persistTaskPropertyValues(
        transaction,
        task.id,
        input.propertyValues,
        true,
      );
    await mirrorLegacyAssignee(transaction, task.id, assigneeId);
    const final = await transaction.task.findUniqueOrThrow({
      where: { id: task.id },
    });

    await recordTaskEvent(
      transaction,
      final.statusId === task.statusId ? 'task.updated' : 'task.moved',
      task.id,
      final.statusId === task.statusId ? null : task.statusId,
    );
    return final;
  });
}
