import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BoardStatus } from '@/components/board/types';
import { useStatusMutations } from '@/components/board/use-status-mutations';

const actions = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  reorder: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/statuses/actions', () => ({
  createStatusAction: actions.create,
  deleteStatusAction: actions.delete,
  reorderStatusesAction: actions.reorder,
  updateStatusAction: actions.update,
}));

const BOARD: BoardStatus[] = [
  {
    color: '#64748B',
    id: 'todo',
    isTerminal: false,
    name: 'To do',
    position: 0,
    tasks: [],
  },
  {
    color: '#22C55E',
    id: 'done',
    isTerminal: true,
    name: 'Done',
    position: 1,
    tasks: [],
  },
];

describe('useStatusMutations', () => {
  /** Resets isolated server-action spies before each status mutation case. */
  beforeEach(() => {
    vi.clearAllMocks();
    actions.delete.mockResolvedValue({ success: true });
    actions.reorder.mockResolvedValue({ success: true });
    actions.update.mockResolvedValue({ success: true });
  });

  /** Proves creation replaces the temporary identifier before refresh is deferred. */
  it('reconciles a created status without remounting settings', async () => {
    actions.create.mockResolvedValue({
      data: {
        color: '#A855F7',
        id: 'archived',
        isTerminal: true,
        name: 'Archived',
        position: 2,
      },
      success: true,
    });
    const refresh = vi.fn();
    const setStatuses = vi.fn();
    const mutations = useStatusMutations({
      refresh,
      setStatuses,
      statuses: BOARD,
    });

    await mutations.create({
      color: '#A855F7',
      isTerminal: true,
      name: 'Archived',
    });

    const optimisticBoard = setStatuses.mock.calls[0]?.[0] as BoardStatus[];
    const reconcile = setStatuses.mock.calls[1]?.[0] as (
      current: BoardStatus[],
    ) => BoardStatus[];
    expect(reconcile(optimisticBoard).at(-1)).toEqual({
      color: '#A855F7',
      id: 'archived',
      isTerminal: true,
      name: 'Archived',
      position: 2,
      tasks: [],
    });
    expect(refresh).toHaveBeenCalledOnce();
  });

  /** Proves ordering also schedules one deferred server reconciliation. */
  it('queues refresh after a successful reorder', async () => {
    const refresh = vi.fn();
    const mutations = useStatusMutations({
      refresh,
      setStatuses: vi.fn(),
      statuses: BOARD,
    });

    await mutations.reorder('todo', 1);

    expect(actions.reorder).toHaveBeenCalledWith({
      statusIds: ['done', 'todo'],
    });
    expect(refresh).toHaveBeenCalledOnce();
  });
});
