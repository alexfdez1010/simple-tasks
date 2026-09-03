import { StatisticsTooltip } from '@/components/statistics/property-statistic-card';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

describe('StatisticsTooltip', () => {
  /** Proves the category and count share one compact tooltip row. */
  it('renders one inline label and value', () => {
    const markup = renderToStaticMarkup(
      <StatisticsTooltip
        active
        label="Unassigned"
        locale="en-US"
        payload={[{ value: 4 }]}
        tasksLabel="tasks"
      />,
    );

    expect(markup).toContain('statistics-tooltip');
    expect(markup).toContain(
      '<span>Unassigned:</span><strong>4 tasks</strong>',
    );
  });

  /** Proves inactive tooltips do not reserve any visible content. */
  it('renders nothing while inactive', () => {
    expect(
      renderToStaticMarkup(
        <StatisticsTooltip
          locale="en-US"
          payload={[{ value: 4 }]}
          tasksLabel="tasks"
        />,
      ),
    ).toBe('');
  });
});
