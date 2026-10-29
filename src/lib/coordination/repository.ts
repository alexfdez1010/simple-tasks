import { readGraphSnapshot } from '@/lib/coordination/graph-repository';
import { deleteUnusedAssignee } from '@/lib/coordination/assignee-deletion';
import { deleteProjectAndMoveTasks } from '@/lib/coordination/project-deletion';
import type { Assignee, PrismaClient, Project } from '@/generated/prisma';
import { runSerializable } from '@/lib/db/transaction';
import {
  coordinatedTask,
  coordinatedTaskInclude,
  type CoordinatedTask,
} from '@/lib/coordination/read-model';
import { mirrorLegacyAssignee } from '@/lib/coordination/ownership';
import { assertDependenciesSatisfied } from '@/lib/coordination/dependencies';
import { editTaskPlacement } from '@/lib/tasks/task-placement';
import { conflict, notFound } from '@/lib/validation/errors';
import type { z } from 'zod';
import type {
  assigneeFields,
  projectFields,
  readyQuery,
  updateAssigneeSchema,
  updateProjectSchema,
  DeleteProjectInput,
} from '@/lib/coordination/schemas';

type AssigneeInput = z.infer<typeof assigneeFields>;
type ProjectInput = z.infer<typeof projectFields>;
export interface CoordinationRepository {
  listAssignees(): Promise<Assignee[]>;
  createAssignee(input: AssigneeInput): Promise<Assignee>;
  updateAssignee(
    input: z.infer<typeof updateAssigneeSchema>,
  ): Promise<Assignee>;
  deleteAssignee(id: string): Promise<void>;
  listProjects(): Promise<Project[]>;
  createProject(input: ProjectInput): Promise<Project>;
  updateProject(input: z.infer<typeof updateProjectSchema>): Promise<Project>;
  deleteProject(input: DeleteProjectInput): Promise<void>;
  snapshot(): Promise<{
    tasks: CoordinatedTask[];
    assignees: Assignee[];
    projects: Project[];
  }>;
  ready(input: z.infer<typeof readyQuery>): Promise<CoordinatedTask[]>;
  start(id: string, assigneeId: string): Promise<CoordinatedTask>;
}

/** Coordinates relationship reads and mutations through one injected database boundary. */
export class PrismaCoordinationRepository implements CoordinationRepository {
  /** Stores the shared Prisma connection; no external agent runtime is invoked. */
  constructor(private readonly client: PrismaClient) {}
  /** Lists user-configured humans and agents by name. */
  listAssignees() {
    return this.client.assignee.findMany({ orderBy: { name: 'asc' } });
  }
  /** Creates a dynamic responsible party, translating unique-name conflicts at the boundary. */
  async createAssignee(input: AssigneeInput) {
    if (await this.client.assignee.findUnique({ where: { name: input.name } }))
      throw conflict('A responsible party already has this name.');
    return this.client.assignee.create({ data: input });
  }
  /** Updates a responsible party and mirrors changed names for legacy readers atomically. */
  updateAssignee({ id, ...input }: z.infer<typeof updateAssigneeSchema>) {
    return runSerializable(this.client, async (transaction) => {
      if (!(await transaction.assignee.findUnique({ where: { id } })))
        throw notFound('The responsible party');
      const existing = input.name
        ? await transaction.assignee.findUnique({ where: { name: input.name } })
        : null;
      if (existing && existing.id !== id)
        throw conflict('A responsible party already has this name.');
      const assignee = await transaction.assignee.update({
        where: { id },
        data: input,
      });
      const tasks = await transaction.task.findMany({
        where: { OR: [{ assigneeId: id }, { reviewerId: id }] },
        select: { id: true, assigneeId: true },
      });
      for (const task of tasks) {
        await mirrorLegacyAssignee(transaction, task.id, task.assigneeId);
        await transaction.task.update({
          where: { id: task.id },
          data: { updatedAt: new Date() },
        });
      }
      return assignee;
    });
  }
  /** Deletes an unused owner by ID, preserving task history and legacy defaults. */
  deleteAssignee(id: string) {
    return deleteUnusedAssignee(this.client, id);
  }
  /** Lists persisted projects without inventing sample content. */
  listProjects() {
    return this.client.project.findMany({ orderBy: { name: 'asc' } });
  }
  /** Creates a named project with its own shared instructions. */
  async createProject(input: ProjectInput) {
    if (await this.client.project.findUnique({ where: { name: input.name } }))
      throw conflict('A project already has this name.');
    return this.client.project.create({ data: input });
  }
  /** Updates editable project fields while preserving all assigned tasks. */
  async updateProject({ id, ...input }: z.infer<typeof updateProjectSchema>) {
    if (!(await this.client.project.findUnique({ where: { id } })))
      throw notFound('The project');
    const existing = input.name
      ? await this.client.project.findUnique({ where: { name: input.name } })
      : null;
    if (existing && existing.id !== id)
      throw conflict('A project already has this name.');
    return this.client.project.update({ where: { id }, data: input });
  }
  /** Deletes one project through the shared task-preserving transaction boundary. */
  deleteProject(input: DeleteProjectInput) {
    return deleteProjectAndMoveTasks(this.client, input);
  }
  /** Returns one repeatable dependency graph snapshot. */
  snapshot() {
    return readGraphSnapshot(this.client);
  }
  /** Lists only work assigned to the requested owner whose stored prerequisites are all completed. */
  async ready(input: z.infer<typeof readyQuery>) {
    const rows = await this.client.task.findMany({
      where: {
        assigneeId: input.assigneeId,
        projectId: input.projectId,
        status: { isTerminal: false, workType: 'READY' },
        dependencies: {
          none: { dependsOn: { status: { isTerminal: false } } },
        },
      },
      orderBy: [
        { dueDate: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
      take: input.limit,
      include: coordinatedTaskInclude,
    });
    return rows.map(coordinatedTask);
  }
  /** Atomically rechecks ownership/readiness and starts a task once; competing callers receive a conflict. */
  start(id: string, assigneeId: string) {
    return runSerializable(this.client, async (transaction) => {
      const task = await transaction.task.findUnique({
        where: { id },
        include: { status: true },
      });
      if (!task) throw notFound('The task');
      if (
        task.assigneeId !== assigneeId ||
        task.status.isTerminal ||
        task.status.workType !== 'READY'
      )
        throw conflict('The task is not available for this responsible party.');
      const target = await transaction.status.findFirst({
        where: { isTerminal: false, workType: 'WORKING' },
        orderBy: { position: 'asc' },
      });
      if (!target)
        throw conflict(
          'Configure a working workflow state before starting tasks.',
        );
      await assertDependenciesSatisfied(transaction, id, target);
      await editTaskPlacement(transaction, task, target, 0);

      return coordinatedTask(
        await transaction.task.findUniqueOrThrow({
          where: { id },
          include: coordinatedTaskInclude,
        }),
      );
    });
  }
}
