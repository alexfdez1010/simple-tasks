import {
  addTask,
  editTask,
  findTask,
  removeTask,
} from '@/components/board/board-state';
import type { BoardStatus } from '@/components/board/types';
import { describe, expect, it } from 'vitest';

const BOARD: BoardStatus[] = [
  {
    color: '#64748B',
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
        title: 'First',
        updatedAt: '2026-08-29T12:00:00.000Z',
      },
      {
        description: 'Text',
        dueDate: '2026-09-05T00:00:00.000Z',
        id: 'task-2',
        position: 1,
        propertyValues: [],
        statusId: 'todo',
        title: 'Second',
        updatedAt: '2026-08-29T12:00:00.000Z',
      },
    ],
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

describe('optimistic board state', () => {
  /** Proves creation appends to the selected column with a contiguous position. */
  it('adds a normalized optimistic task', () => {
    const result = addTask(
      structuredClone(BOARD),
      {
        description: '**Markdown**',
        dueDate: '2026-10-01',
        propertyValues: [],
        statusId: 'done',
        title: 'New',
      },
      'task-3',
    );

    expect(findTask(result, 'task-3')).toMatchObject({
      index: 0,
      status: { id: 'done' },
      task: {
        description: '**Markdown**',
        dueDate: '2026-10-01',
        position: 0,
        statusId: 'done',
        title: 'New',
      },
    });
  });

  /** Proves editing across columns removes the source and appends to the target. */
  it('edits and moves a task while compacting both columns', () => {
    const result = editTask(structuredClone(BOARD), 'task-1', {
      description: '',
      dueDate: '',
      propertyValues: [],
      statusId: 'done',
      title: 'First edited',
    });

    expect(result[0]?.tasks).toEqual([
      expect.objectContaining({ id: 'task-2', position: 0 }),
    ]);
    expect(result[1]?.tasks).toEqual([
      expect.objectContaining({
        description: null,
        dueDate: null,
        id: 'task-1',
        position: 0,
        statusId: 'done',
        title: 'First edited',
      }),
    ]);
  });

  /** Proves deletion closes ordering gaps without mutating other columns. */
  it('removes a task and compacts remaining positions', () => {
    const result = removeTask(structuredClone(BOARD), 'task-1');

    expect(result[0]?.tasks).toEqual([
      expect.objectContaining({ id: 'task-2', position: 0 }),
    ]);
    expect(result[1]).toEqual(BOARD[1]);
  });
});
