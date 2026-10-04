import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { TaskCard } from '@/components/board/task-card';
import type { BoardTask } from '@/components/board/types';
import { I18nProvider } from '@/lib/i18n/provider';

vi.mock('@dnd-kit/react/sortable', () => ({
  useSortable: () => ({
    ref: undefined,
    handleRef: undefined,
    isDragging: false,
  }),
}));
vi.mock('@/components/board/task-dialog', () => ({ TaskDialog: () => null }));

/** Renders the card's content contract without drag sensors or modal portals. */
function renderCard(description: string | null = null): string {
  const task: BoardTask = {
    id: 'task',
    title: 'Review specification',
    description,
    statusId: 'todo',
    position: 0,
    dueDate: null,
    updatedAt: '2026-10-04T12:00:00Z',
    propertyValues: [],
  };
  return renderToStaticMarkup(
    <I18nProvider language="en">
      <TaskCard
        task={task}
        status={{
          id: 'todo',
          name: 'To do',
          color: '#64748b',
          isTerminal: false,
          position: 0,
          tasks: [task],
        }}
        index={0}
        properties={[]}
        onSave={async () => ({ success: true })}
        onDelete={async () => ({ success: true })}
      />
    </I18nProvider>,
  );
}

describe('task card inspection semantics', () => {
  /** Preserves the heading and one native inspection control without empty tab stops. */
  it('renders a semantic heading and one details button for a title-only task', () => {
    const markup = renderCard();
    expect(markup).toMatch(
      /<h3[^>]*>.*<button[^>]*aria-label="Open details for Review specification"/,
    );
    expect(markup.match(/aria-label="Open details for/g)).toHaveLength(1);
    expect(markup).not.toContain('role="button"');
  });

  /** Keeps external Markdown links independently navigable and safe. */
  it('renders description links outside a button and omits unsafe HTML', () => {
    const markup = renderCard(
      '[Guide](https://example.com) <script>bad()</script>',
    );
    expect(markup).toContain('href="https://example.com"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain('<script>');
    expect(markup).not.toMatch(/<button[^>]*>[^]*<a[^]*<\/button>/);
    expect(markup.match(/aria-label="Open details for/g)).toHaveLength(1);
  });
});
