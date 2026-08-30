import { getBoardMetrics } from '@/components/board/board-metrics';
import type { BoardStatus } from '@/components/board/types';
import { describe, expect, it } from 'vitest';

const EMPTY_TASK = {
  description: null,
  dueDate: null,
  position: 0,
  propertyValues: [],
  statusId: 'active',
  title: 'Task',
  updatedAt: '2026-08-30T08:00:00.000Z',
};

/** Creates a minimal status fixture with the requested number of visible tasks. */
function makeStatus(
  id: string,
  isTerminal: boolean,
  taskCount: number,
): BoardStatus {
  return {
    color: '#64748B',
    id,
    isTerminal,
    name: id,
    position: 0,
    tasks: Array.from({ length: taskCount }, (_, index) => ({
      ...EMPTY_TASK,
      id: `${id}-${index}`,
      position: index,
      statusId: id,
    })),
  };
}

describe('getBoardMetrics', () => {
  /** Proves active and terminal tasks produce a stable visible-board summary. */
  it('counts visible work and rounds completion percentage', () => {
    expect(
      getBoardMetrics([
        makeStatus('active', false, 2),
        makeStatus('done', true, 1),
      ]),
    ).toEqual({
      activeCount: 2,
      completedCount: 1,
      completionPercentage: 33,
      visibleCount: 3,
    });
  });

  /** Proves an empty board never emits an invalid progress value. */
  it('returns zero progress for an empty board', () => {
    expect(getBoardMetrics([])).toEqual({
      activeCount: 0,
      completedCount: 0,
      completionPercentage: 0,
      visibleCount: 0,
    });
  });
});
