import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { PrismaTaskRepository } from '@/lib/tasks/prisma-repository';
import { TaskService } from '@/lib/tasks/service';
import { ReviewService } from '@/lib/coordination/reviews';
import { PrismaReviewRepository } from '@/lib/coordination/review-repository';
import { PrismaCoordinationRepository } from '@/lib/coordination/repository';

const prefix = 'test:reviews:';
const tasks = new TaskService(new PrismaTaskRepository(db));
const reviews = new ReviewService(new PrismaReviewRepository(db));
const coordination = new PrismaCoordinationRepository(db);
let owner: string;
let reviewer: string;
let project: string;

/** Clears only this suite's relationships, tasks and dynamic responsible parties. */
async function cleanup() {
  const rows = await db.task.findMany({
    where: { title: { startsWith: prefix } },
    select: { id: true },
  });
  const ids = rows.map((row) => row.id);
  await db.taskDependency.deleteMany({
    where: { OR: [{ taskId: { in: ids } }, { dependsOnId: { in: ids } }] },
  });
  await db.task.deleteMany({ where: { id: { in: ids } } });
  await db.assignee.deleteMany({ where: { name: { startsWith: prefix } } });
  await db.project.deleteMany({ where: { name: { startsWith: prefix } } });
}

/** Creates a reviewable deliverable for the dynamically configured owner. */
function create(title = 'deliverable') {
  return tasks.create({
    title: prefix + title,
    statusId: 'todo',
    assigneeId: owner,
    reviewerId: reviewer,
    projectId: project,
  });
}

describe('optional independent review', () => {
  beforeAll(async () => {
    await db.$connect();
  });
  beforeEach(async () => {
    await cleanup();
    owner = (
      await db.assignee.create({
        data: { name: prefix + 'agent', kind: 'AGENT' },
      })
    ).id;
    reviewer = (
      await db.assignee.create({
        data: { name: prefix + 'human', kind: 'HUMAN' },
      })
    ).id;
    project = (await db.project.create({ data: { name: prefix + 'project' } }))
      .id;
  });
  afterAll(async () => {
    await cleanup();
    await db.$disconnect();
  });

  it('requires approval before completion or unlocking downstream tasks', async () => {
    const task = await create();
    const dependent = await tasks.create({
      title: prefix + 'dependent',
      assigneeId: owner,
      projectId: project,
      statusId: 'todo',
      dependencyIds: [task.id],
    });
    await expect(
      tasks.move({ id: task.id, statusId: 'done', index: 0 }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const submitted = await reviews.submit({ id: task.id, assigneeId: owner });
    expect(submitted).toMatchObject({
      reviewState: 'PENDING',
      completedAt: null,
      assigneeId: owner,
      reviewer: { id: reviewer },
    });
    expect(
      (await reviews.list({ reviewerId: reviewer })).map((row) => row.id),
    ).toEqual([task.id]);
    expect(
      (await coordination.ready({ assigneeId: owner, limit: 20 })).some(
        (row) => row.id === dependent.id,
      ),
    ).toBe(false);
    const approved = await reviews.decide({
      id: task.id,
      reviewerId: reviewer,
      expectedUpdatedAt: submitted.updatedAt.toISOString(),
      decision: 'APPROVE',
    });
    expect(approved.reviewState).toBe('APPROVED');
    expect(approved.completedAt).toBeInstanceOf(Date);
    expect(approved.assigneeId).toBe(owner);
    expect(
      (await coordination.ready({ assigneeId: owner, limit: 20 })).some(
        (row) => row.id === dependent.id,
      ),
    ).toBe(true);
  });
  it('returns requested changes to the original owner and requires an actionable note', async () => {
    const task = await create();
    const submitted = await reviews.submit({ id: task.id, assigneeId: owner });
    expect(() =>
      reviews.decide({
        id: task.id,
        reviewerId: reviewer,
        expectedUpdatedAt: submitted.updatedAt.toISOString(),
        decision: 'REQUEST_CHANGES',
        note: ' ',
      }),
    ).toThrow();
    const returned = await reviews.decide({
      id: task.id,
      reviewerId: reviewer,
      expectedUpdatedAt: submitted.updatedAt.toISOString(),
      decision: 'REQUEST_CHANGES',
      note: 'Cover the expired-link case.',
    });
    expect(returned).toMatchObject({
      assigneeId: owner,
      reviewState: 'CHANGES_REQUESTED',
      completedAt: null,
      reviewNote: 'Cover the expired-link case.',
      status: { workType: 'READY' },
    });
    expect(
      (await coordination.ready({ assigneeId: owner, limit: 20 })).some(
        (row) => row.id === task.id,
      ),
    ).toBe(true);
    await tasks.update({
      id: task.id,
      description: 'Expired-link case covered.',
    });
    const resubmitted = await reviews.submit({
      id: task.id,
      assigneeId: owner,
    });
    await expect(
      reviews.decide({
        id: task.id,
        reviewerId: reviewer,
        expectedUpdatedAt: resubmitted.updatedAt.toISOString(),
        decision: 'APPROVE',
      }),
    ).resolves.toMatchObject({ reviewState: 'APPROVED' });
  });
  it('rejects self-review, wrong reviewers, premature submission and outdated decisions', async () => {
    await expect(
      tasks.create({
        title: prefix + 'self',
        assigneeId: owner,
        reviewerId: owner,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const parent = await tasks.create({
      title: prefix + 'parent',
      assigneeId: owner,
      statusId: 'todo',
    });
    const task = await create();
    await tasks.update({ id: task.id, dependencyIds: [parent.id] });
    await expect(
      reviews.submit({ id: task.id, assigneeId: owner }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await tasks.move({ id: parent.id, statusId: 'done', index: 0 });
    const submitted = await reviews.submit({ id: task.id, assigneeId: owner });
    await expect(
      reviews.decide({
        id: task.id,
        reviewerId: owner,
        expectedUpdatedAt: submitted.updatedAt.toISOString(),
        decision: 'APPROVE',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await tasks.update({ id: task.id, description: 'New deliverable' });
    await expect(
      reviews.decide({
        id: task.id,
        reviewerId: reviewer,
        expectedUpdatedAt: submitted.updatedAt.toISOString(),
        decision: 'APPROVE',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(
      (await db.task.findUniqueOrThrow({ where: { id: task.id } })).reviewState,
    ).toBe('NOT_REQUESTED');
  });
  it('invalidates an approval when older code changes reviewed content', async () => {
    const task = await create();
    const submitted = await reviews.submit({ id: task.id, assigneeId: owner });
    await reviews.decide({
      id: task.id,
      reviewerId: reviewer,
      expectedUpdatedAt: submitted.updatedAt.toISOString(),
      decision: 'APPROVE',
    });
    const changed = await db.task.update({
      where: { id: task.id },
      data: { description: 'Changed by an older deployment' },
    });
    expect(changed).toMatchObject({
      reviewState: 'NOT_REQUESTED',
      completedAt: null,
      reviewedAt: null,
      statusId: 'todo',
    });
    await expect(
      db.task.update({
        where: { id: task.id },
        data: { completedAt: new Date() },
      }),
    ).rejects.toThrow();
  });
  it('allows only one concurrent review decision to commit', async () => {
    const task = await create();
    const submitted = await reviews.submit({ id: task.id, assigneeId: owner });
    const common = {
      id: task.id,
      reviewerId: reviewer,
      expectedUpdatedAt: submitted.updatedAt.toISOString(),
    };
    const results = await Promise.allSettled([
      reviews.decide({ ...common, decision: 'APPROVE' }),
      reviews.decide({
        ...common,
        decision: 'REQUEST_CHANGES',
        note: 'Needs changes',
      }),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
  });
  it('invalidates reviewed custom properties but preserves approval for unchanged form values', async () => {
    const property = await db.taskPropertyDefinition.create({
      data: { name: prefix + 'evidence', type: 'TEXT', position: 100 },
    });
    try {
      const task = await create();
      await tasks.update({
        id: task.id,
        propertyValues: [{ propertyId: property.id, value: 'original' }],
      });
      const submitted = await reviews.submit({
        id: task.id,
        assigneeId: owner,
      });
      await reviews.decide({
        id: task.id,
        reviewerId: reviewer,
        expectedUpdatedAt: submitted.updatedAt.toISOString(),
        decision: 'APPROVE',
      });
      const unchanged = await tasks.update({
        id: task.id,
        propertyValues: [{ propertyId: property.id, value: 'original' }],
      });
      expect(unchanged.reviewState).toBe('APPROVED');
      await db.taskPropertyValue.update({
        where: {
          taskId_propertyId: { taskId: task.id, propertyId: property.id },
        },
        data: { value: 'changed' },
      });
      expect(
        await db.task.findUniqueOrThrow({ where: { id: task.id } }),
      ).toMatchObject({ reviewState: 'NOT_REQUESTED', completedAt: null });
    } finally {
      await db.taskPropertyDefinition.delete({ where: { id: property.id } });
    }
  });
  it('keeps ordinary completion unchanged when no reviewer is assigned', async () => {
    const task = await tasks.create({
      title: prefix + 'ordinary',
      assigneeId: owner,
      statusId: 'todo',
    });
    await expect(
      tasks.move({ id: task.id, statusId: 'done', index: 0 }),
    ).resolves.toMatchObject({ statusId: 'done' });
  });
});
