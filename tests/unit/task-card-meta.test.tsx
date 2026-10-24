import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskCardMeta } from '@/components/board/task-card-meta';
import type { BoardTask, PropertyDefinition } from '@/components/board/types';
import { I18nProvider } from '@/lib/i18n/provider';

const task: BoardTask = {
  id: 'task',
  title: 'Review',
  description: 'Full detail',
  statusId: 'todo',
  position: 0,
  updatedAt: '2026-10-24T10:00:00Z',
  dueDate: null,
  propertyValues: [],
};
/** Renders the real metadata with predictable time and the selected locale. */
function render(
  overrides: Partial<BoardTask> = {},
  properties: PropertyDefinition[] = [],
) {
  return renderToStaticMarkup(
    <I18nProvider language="en">
      <TaskCardMeta task={{ ...task, ...overrides }} properties={properties} />
    </I18nProvider>,
  );
}

describe('compact task metadata', () => {
  afterEach(() => vi.useRealTimers());
  it('omits empty metadata and unrelated configured properties', () => {
    expect(render()).toBe('');
    expect(
      render({ propertyValues: [{ propertyId: 'priority', value: 'High' }] }, [
        {
          id: 'priority',
          name: 'Priority',
          type: 'SELECT',
          options: ['High'],
          position: 0,
        },
      ]),
    ).toBe('');
  });
  it('shows the configured assignee without relying on its database id', () => {
    const markup = render(
      { propertyValues: [{ propertyId: 'owner', value: 'Codex' }] },
      [
        {
          id: 'owner',
          name: 'Responsable',
          type: 'SELECT',
          options: ['Codex'],
          position: 0,
        },
      ],
    );
    expect(markup).toContain('Codex');
    expect(markup).toContain('Responsable');
  });
  it('distinguishes overdue work from completed tasks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T10:00:00Z'));
    expect(render({ dueDate: '2026-10-23T00:00:00Z' })).toContain('Overdue');
    const completed = render({
      dueDate: '2026-10-23T00:00:00Z',
      completedAt: '2026-10-24T09:00:00Z',
    });
    expect(completed).toContain('Completed');
    expect(completed).not.toContain('Overdue');
    expect(completed).not.toContain('2026-10-23');
  });
});
