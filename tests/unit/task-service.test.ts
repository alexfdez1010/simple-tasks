import type { Task } from '@/generated/prisma';
import type { TaskRepository } from '@/lib/tasks/repository';
import { TaskService } from '@/lib/tasks/service';
import { describe, expect, it, vi } from 'vitest';

const SAVED_TASK = {
  completedAt: null,
  createdAt: new Date('2026-08-29T12:00:00.000Z'),
  description: null,
  dueDate: null,
  id: 'task-1',
  position: 0,
  statusId: 'status-1',
  title: 'Task',
  updatedAt: new Date('2026-08-29T12:00:00.000Z'),
} satisfies Task;

/** Creates an isolated persistence spy that satisfies the task service contract. */
function createRepository(
  overrides: Partial<TaskRepository> = {},
): TaskRepository {
  return {
    create: vi.fn(async () => SAVED_TASK),
    delete: vi.fn(async () => undefined),
    findById: vi.fn(async () => null),
    listBoard: vi.fn(async () => []),
    move: vi.fn(async () => SAVED_TASK),
    reorder: vi.fn(async () => undefined),
    update: vi.fn(async () => SAVED_TASK),
    ...overrides,
  };
}

describe('TaskService', () => {
  /** Proves task creation normalizes text and dates before persistence. */
  it('validates and normalizes a create command', async () => {
    const repository = createRepository();
    const service = new TaskService(repository);

    await service.create({
      description: '  **content**  ',
      dueDate: '2026-09-05',
      statusId: '  status-1  ',
      title: '  Test task  ',
    });

    expect(repository.create).toHaveBeenCalledWith({
      description: '**content**',
      dueDate: new Date('2026-09-05T00:00:00.000Z'),
      statusId: 'status-1',
      title: 'Test task',
    });
  });

  /** Proves invalid editable fields never cross the repository boundary. */
  it('rejects blank titles and oversized Markdown', () => {
    const repository = createRepository();
    const service = new TaskService(repository);

    expect(() => service.create({ title: '   ' })).toThrow();
    expect(() =>
      service.create({ title: 'Task', description: 'x'.repeat(20_001) }),
    ).toThrow();
    expect(repository.create).not.toHaveBeenCalled();
  });

  /** Proves partial updates preserve omitted values and clear explicit dates. */
  it('distinguishes omitted and explicitly cleared update dates', async () => {
    const repository = createRepository();
    const service = new TaskService(repository);

    await service.update({ id: 'task-1', title: '  Renamed  ' });
    expect(repository.update).toHaveBeenLastCalledWith({
      id: 'task-1',
      title: 'Renamed',
      dueDate: undefined,
    });

    await service.update({ id: 'task-1', dueDate: null });
    expect(repository.update).toHaveBeenLastCalledWith({
      id: 'task-1',
      dueDate: null,
    });
  });

  /** Proves field edits and a requested relocation cross one repository boundary. */
  it('validates an atomic edit and status change command', async () => {
    const repository = createRepository();
    const service = new TaskService(repository);

    await service.update({
      id: ' task-1 ',
      index: 0,
      statusId: ' done ',
      title: '  Completed  ',
    });

    expect(repository.update).toHaveBeenCalledWith({
      dueDate: undefined,
      id: 'task-1',
      index: 0,
      statusId: 'done',
      title: 'Completed',
    });
    expect(() => service.update({ id: 'task-1', statusId: 'done' })).toThrow(
      'Status and position must be provided together.',
    );
  });

  /** Proves missing tasks become stable domain errors. */
  it('returns a NOT_FOUND domain error for an unknown task', async () => {
    const service = new TaskService(createRepository());

    await expect(service.getById('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'The task does not exist.',
    });
  });

  /** Proves movement rejects unsafe indices before persistence. */
  it('rejects negative or fractional movement indices', () => {
    const repository = createRepository();
    const service = new TaskService(repository);

    expect(() =>
      service.move({ id: 'task-1', index: -1, statusId: 'status-2' }),
    ).toThrow();
    expect(() =>
      service.move({ id: 'task-1', index: 1.5, statusId: 'status-2' }),
    ).toThrow();
    expect(repository.move).not.toHaveBeenCalled();
  });

  /** Proves reorder commands retain caller order while trimming identifiers. */
  it('validates a complete reorder command', async () => {
    const repository = createRepository();
    const service = new TaskService(repository);

    await service.reorder({
      statusId: ' status-1 ',
      taskIds: [' task-3 ', 'task-1', 'task-2'],
    });

    expect(repository.reorder).toHaveBeenCalledWith({
      statusId: 'status-1',
      taskIds: ['task-3', 'task-1', 'task-2'],
    });
  });
});
