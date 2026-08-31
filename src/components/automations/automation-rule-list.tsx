'use client';

import { Button } from '@heroui/react';

import { AddRuleIcon } from '@/components/automations/automation-icons';
import { AutomationRuleCard } from '@/components/automations/automation-rule-card';
import type {
  AutomationDefinition,
  AutomationStatus,
  PropertyDefinition,
} from '@/components/automations/types';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationRuleListProps {
  automations: AutomationDefinition[];
  editingId: string | null;
  properties: PropertyDefinition[];
  statuses: AutomationStatus[];
  onCreate: () => void;
  onDelete: (id: string) => Promise<boolean>;
  onEdit: (id: string) => void;
}

/** Renders one named group of automation definitions. */
function RuleGroup({
  automations,
  editingId,
  label,
  properties,
  statuses,
  onDelete,
  onEdit,
}: Omit<AutomationRuleListProps, 'onCreate'> & { label: string }) {
  if (automations.length === 0) return null;
  return (
    <section className="automation-rule-group" aria-label={label}>
      <div className="automation-rule-group-heading">
        <h2>{label}</h2>
        <span>{automations.length}</span>
      </div>
      <div className="automation-rule-stack">
        {automations.map((automation) => (
          <AutomationRuleCard
            key={automation.id}
            automation={automation}
            isSelected={editingId === automation.id}
            properties={properties}
            statuses={statuses}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}

/** Groups automation rules by mental model and handles the empty state. */
export function AutomationRuleList({
  automations,
  editingId,
  properties,
  statuses,
  onCreate,
  onDelete,
  onEdit,
}: AutomationRuleListProps): React.JSX.Element {
  const { t } = useI18n();
  const workflowRules = automations.filter(
    (automation) => automation.triggerType === 'STATUS_CHANGE',
  );
  const scheduledRules = automations.filter(
    (automation) => automation.triggerType === 'SCHEDULED',
  );

  if (automations.length === 0) {
    return (
      <div className="automation-empty-state">
        <span className="automation-empty-mark" aria-hidden="true">
          01
        </span>
        <h2>{t('automation.emptyTitle')}</h2>
        <p>{t('automation.emptyDescription')}</p>
        <Button onPress={onCreate}>
          <AddRuleIcon className="size-4" />
          {t('automation.startFirst')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <RuleGroup
        automations={workflowRules}
        editingId={editingId}
        label={t('automation.workflowRules')}
        properties={properties}
        statuses={statuses}
        onDelete={onDelete}
        onEdit={onEdit}
      />
      <RuleGroup
        automations={scheduledRules}
        editingId={editingId}
        label={t('automation.scheduledTasks')}
        properties={properties}
        statuses={statuses}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  );
}
