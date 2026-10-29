import { recordTaskEvent } from '@/lib/webhooks/outbox';
import type { PrismaClient } from '@/generated/prisma';
import type { z } from 'zod';
import type {
  reviewDecisionSchema,
  reviewQuery,
  submitReviewSchema,
} from '@/lib/coordination/schemas';
import { runSerializable } from '@/lib/db/transaction';
import {
  coordinatedTask,
  coordinatedTaskInclude,
  type CoordinatedTask,
} from '@/lib/coordination/read-model';
import { assertDependenciesSatisfied } from '@/lib/coordination/dependencies';
import { editTaskPlacement } from '@/lib/tasks/task-placement';
import { conflict, notFound } from '@/lib/validation/errors';

export interface ReviewRepository {
  /** Lists pending reviews assigned to an explicit human or agent. */
  list(input: z.infer<typeof reviewQuery>): Promise<CoordinatedTask[]>;
  /** Submits a completed deliverable while retaining its original owner. */
  submit(input: z.infer<typeof submitReviewSchema>): Promise<CoordinatedTask>;
  /** Records a version-checked decision from the assigned reviewer. */
  decide(input: z.infer<typeof reviewDecisionSchema>): Promise<CoordinatedTask>;
}

/** Persists review workflow transitions, decisions and task events atomically. */
export class PrismaReviewRepository implements ReviewRepository {
  /** Injects the database connection, shared by human actions and agent transports. */
  constructor(private readonly client: PrismaClient) {}
  /** Lists bounded reviews with owner, project and prerequisite context. */
  async list(input: z.infer<typeof reviewQuery>) {
    const rows = await this.client.task.findMany({
      where: {
        reviewerId: input.reviewerId,
        reviewState: 'PENDING',
        status: { isTerminal: false, workType: 'REVIEW' },
      },
      orderBy: { updatedAt: 'asc' },
      take: input.limit,
      include: coordinatedTaskInclude,
    });
    return rows.map(coordinatedTask);
  }
  /** Sends a task to review after validating ownership and prerequisites. */
  submit(input: z.infer<typeof submitReviewSchema>) {
    return runSerializable(this.client, async (transaction) => {
      const task = await transaction.task.findUnique({
        where: { id: input.id },
        include: { status: true },
      });
      if (!task) throw notFound('The task');
      if (
        !task.reviewerId ||
        task.assigneeId !== input.assigneeId ||
        task.status.isTerminal ||
        task.reviewState === 'PENDING'
      )
        throw conflict('This task is not available for review submission.');
      const target = await transaction.status.findFirst({
        where: { isTerminal: false, workType: 'REVIEW' },
        orderBy: { position: 'asc' },
      });
      if (!target) throw conflict('Configure a review workflow state first.');
      await assertDependenciesSatisfied(transaction, task.id, {
        isTerminal: false,
        workType: 'WORKING',
      });
      await editTaskPlacement(transaction, task, target, 0, {
        reviewState: 'PENDING',
        reviewNote: null,
        reviewedAt: null,
      });

      await recordTaskEvent(
        transaction,
        task.statusId === target.id ? 'task.updated' : 'task.moved',
        task.id,
        task.statusId === target.id ? null : task.statusId,
      );
      return coordinatedTask(
        await transaction.task.findUniqueOrThrow({
          where: { id: task.id },
          include: coordinatedTaskInclude,
        }),
      );
    });
  }
  /** Approves the exact submitted version or returns it to ready work with actionable feedback. */
  decide(input: z.infer<typeof reviewDecisionSchema>) {
    return runSerializable(this.client, async (transaction) => {
      const task = await transaction.task.findUnique({
        where: { id: input.id },
        include: { status: true },
      });
      if (!task) throw notFound('The task');
      if (
        task.reviewerId !== input.reviewerId ||
        task.reviewState !== 'PENDING' ||
        task.status.workType !== 'REVIEW' ||
        task.status.isTerminal
      )
        throw conflict(
          'This review is not assigned to this responsible party or is no longer pending.',
        );
      if (task.updatedAt.toISOString() !== input.expectedUpdatedAt)
        throw conflict(
          'The task changed since it was read. Reload it before saving.',
        );
      const approved = input.decision === 'APPROVE';
      if (!approved && !input.note?.trim())
        throw conflict('Explain the requested changes.');
      const target = await transaction.status.findFirst({
        where: approved
          ? { isTerminal: true }
          : { isTerminal: false, workType: 'READY' },
        orderBy: { position: 'asc' },
      });
      if (!target)
        throw conflict('Configure the destination workflow state first.');
      await assertDependenciesSatisfied(transaction, task.id, target);
      await editTaskPlacement(transaction, task, target, 0, {
        reviewState: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
        reviewNote: input.note ?? null,
        reviewedAt: new Date(),
      });

      await recordTaskEvent(transaction, 'task.moved', task.id, task.statusId);
      return coordinatedTask(
        await transaction.task.findUniqueOrThrow({
          where: { id: task.id },
          include: coordinatedTaskInclude,
        }),
      );
    });
  }
}
