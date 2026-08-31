'use client';

import type { AutomationDefinition } from '@/components/automations/types';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationMetricsProps {
  automations: AutomationDefinition[];
}

/** Summarizes total rules and scheduled work still waiting to execute. */
export function AutomationMetrics({
  automations,
}: AutomationMetricsProps): React.JSX.Element {
  const { t } = useI18n();
  const pendingCount = automations.filter(
    (automation) =>
      automation.triggerType === 'SCHEDULED' && !automation.executedAt,
  ).length;

  return (
    <div className="automation-metrics" aria-label={t('automation.summary')}>
      <p>
        <strong>{automations.length}</strong>{' '}
        {t(
          automations.length === 1
            ? 'automation.ruleCount.one'
            : 'automation.ruleCount.other',
        )}
      </p>
      <span aria-hidden="true" />
      <p>
        <strong>{pendingCount}</strong>{' '}
        {t(
          pendingCount === 1
            ? 'automation.pendingCount.one'
            : 'automation.pendingCount.other',
        )}
      </p>
    </div>
  );
}
