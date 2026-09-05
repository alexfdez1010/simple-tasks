import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { StatisticChartLegend } from '@/components/statistics/statistic-chart-legend';
import { I18nProvider } from '@/lib/i18n/provider';
import type { Language } from '@/lib/i18n/config';

/** Renders a property sum whose task share deliberately differs from its numeric value. */
function renderLegend(
  percentage: number,
  language: Language = 'en',
  multiValue = false,
): string {
  const entry = {
    color: '#347956',
    displayLabel: 'Design',
    label: 'Design',
    percentage,
    taskCount: 2,
    value: 840,
    plottedValue: 840,
  };
  return renderToStaticMarkup(
    <I18nProvider language={language}>
      <StatisticChartLegend
        data={[entry]}
        definition={{ name: 'Effort by team' }}
        result={{
          format: 'NUMBER',
          kind: 'CHART',
          multiValue,
          values: [entry],
        }}
      />
    </I18nProvider>,
  );
}

describe('statistics share legend', () => {
  /** Keeps task proportions distinct from the configured numeric measure. */
  it('renders the exact measure and uses task share for the visual bar', () => {
    const markup = renderLegend(25);
    expect(markup).toContain('<strong>840</strong>');
    expect(markup).toContain('25% of filtered tasks');
    expect(markup).toContain('width:25%');
    expect(markup).toContain('aria-hidden="true"');
  });

  /** Prevents oversized or negative visual bars while retaining the supplied text. */
  it.each([
    [-10, 0],
    [0, 0],
    [100, 100],
    [120, 100],
  ])('bounds %s to %s percent', (value, width) => {
    expect(renderLegend(value)).toContain(`width:${width}%`);
  });

  /** Preserves localized labels and the warning about overlapping categories. */
  it('localizes task shares and explains multi-value categories', () => {
    const markup = renderLegend(25, 'es', true);
    expect(markup).toContain('25% de las tareas filtradas');
    expect(markup).toContain(
      'Una tarea puede contribuir a más de una categoría.',
    );
  });
});
