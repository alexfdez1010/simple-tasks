import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BoardStatus } from '@/components/board/types';
import { useTaskMutations } from '@/components/board/use-task-mutations';

const actions = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  move: vi.fn(),
  reorder: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/tasks/actions', () => ({
  createTaskAction: actions.create,
  deleteTaskAction: actions.delete,
  moveTaskAction: actions.move,
  reorderTasksAction: actions.reorder,
  updateTaskAction: actions.update,
}));

const BOARD: BoardStatus[] = [
  {
    color: '#64748b',
    id: 'todo',
    isTerminal: false,
    name: 'To do',
    position: 0,
    tasks: [
      {
        description: null,
        dueDate: null,
        id: 'task-1',
        position: 0,
        propertyValues: [],
        statusId: 'todo',
        title: 'Original',
        updatedAt: '2026-08-29T12:00:00.000Z',
      },
    ],
  },
  {
    color: '#22c55e',
    id: 'done',
    isTerminal: true,
    name: 'Done',
    position: 1,
    tasks: [],
  },
];

describe('useTaskMutations', () => {
  /** Resets isolated server-action spies before each mutation case. */
  beforeEach(() => {
    vi.clearAllMocks();
    actions.create.mockResolvedValue({ success: true });
    actions.move.mockResolvedValue({ success: true });
    actions.reorder.mockResolvedValue({ success: true });
    actions.update.mockResolvedValue({ success: true });
  });

  /** Proves successful creation reconciles the optimistic id with persistence. */
  it('replaces a temporary task id with the canonical server id', async () => {
    actions.create.mockResolvedValue({
      data: { id: 'task-persisted' },
      success: true,
    });
    const setStatuses = vi.fn();
    const mutations = useTaskMutations({
      announce: vi.fn(),
      refresh: vi.fn(),
      setStatuses,
      statuses: BOARD,
    });

    await mutations.create({
      description: '',
      dueDate: '',
      propertyValues: [],
      statusId: 'todo',
      title: 'Persisted',
    });

    const optimisticBoard = setStatuses.mock.calls[0]?.[0] as BoardStatus[];
    const reconcile = setStatuses.mock.calls[1]?.[0] as (
      current: BoardStatus[],
    ) => BoardStatus[];
    const reconciled = reconcile(optimisticBoard);
    expect(reconciled[0]?.tasks.at(-1)).toMatchObject({
      id: 'task-persisted',
      title: 'Persisted',
    });
    expect(
      reconciled
        .flatMap(({ tasks }) => tasks)
        .some(({ id }) => id.startsWith('optimistic-')),
    ).toBe(false);
  });

  /** Proves the edit dialog persists fields and status through one server action. */
  it('updates and relocates a task with one atomic command', async () => {
    const refresh = vi.fn();
    const setStatuses = vi.fn();
    const mutations = useTaskMutations({
      announce: vi.fn(),
      refresh,
      setStatuses,
      statuses: BOARD,
    });

    await expect(
      mutations.update('task-1', {
        description: '**finished**',
        dueDate: '2026-09-01',
        propertyValues: [],
        statusId: 'done',
        title: 'Finished',
      }),
    ).resolves.toEqual({ success: true });

    expect(actions.update).toHaveBeenCalledOnce();
    expect(actions.update).toHaveBeenCalledWith({
      description: '**finished**',
      dueDate: '2026-09-01',
      id: 'task-1',
      index: 0,
      propertyValues: [],
      statusId: 'done',
      title: 'Finished',
    });
    expect(actions.move).not.toHaveBeenCalled();
    expect(setStatuses).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
  });

  /** Proves terminal-column drags remain local and never persist unsupported order. */
  it('does not persist reordering within a terminal status', async () => {
    const terminalTasks = BOARD[0]!.tasks.map((task, index) => ({
      ...task,
      id: `done-${index}`,
      statusId: 'done',
    }));
    const snapshot = structuredClone(BOARD);
    snapshot[0]!.tasks = [];
    snapshot[1]!.tasks = terminalTasks;
    const finalBoard = structuredClone(snapshot);
    finalBoard[1]!.tasks.reverse();
    const setStatuses = vi.fn();
    const refresh = vi.fn();
    const mutations = useTaskMutations({
      announce: vi.fn(),
      refresh,
      setStatuses,
      statuses: snapshot,
    });

    await mutations.persistDrag('done-0', snapshot, finalBoard);

    expect(actions.move).not.toHaveBeenCalled();
    expect(actions.reorder).not.toHaveBeenCalled();
    expect(setStatuses).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  /** Proves cross-column drag persistence still delegates one atomic move. */
  it('persists a drag across statuses through moveTaskAction', async () => {
    const finalBoard = structuredClone(BOARD);
    const [task] = finalBoard[0]!.tasks.splice(0, 1);
    finalBoard[1]!.tasks = [{ ...task!, position: 0, statusId: 'done' }];
    const refresh = vi.fn();
    const mutations = useTaskMutations({
      announce: vi.fn(),
      refresh,
      setStatuses: vi.fn(),
      statuses: BOARD,
    });

    await mutations.persistDrag('task-1', BOARD, finalBoard);

    expect(actions.move).toHaveBeenCalledOnce();
    expect(actions.move).toHaveBeenCalledWith({
      id: 'task-1',
      index: 0,
      statusId: 'done',
    });
    expect(actions.reorder).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
