import { taskListOrder } from '@/lib/tasks/ordering';
import { describe, expect, it } from 'vitest';

describe('taskListOrder', () => {
  /** Keeps active work driven by the nearest due date. */
  it('orders active tasks by ascending due date', () => {
    expect(taskListOrder(false)).toEqual([
      { dueDate: { sort: 'asc', nulls: 'last' } },
      { position: 'asc' },
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
  });

  /** Keeps terminal work driven by the latest completion date. */
  it('orders terminal tasks by descending completion date', () => {
    expect(taskListOrder(true)).toEqual([
      { completedAt: { sort: 'desc', nulls: 'last' } },
      { dueDate: { sort: 'desc', nulls: 'last' } },
      { updatedAt: 'desc' },
      { id: 'asc' },
    ]);
  });
});
