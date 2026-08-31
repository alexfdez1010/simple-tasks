'use client';

import { Button, Card } from '@heroui/react';
import { useDateFormatter } from '@react-aria/i18n';

import {
  EditRuleIcon,
  RuleIcon,
  ScheduledIcon,
} from '@/components/automations/automation-icons';
import type {
  AutomationDefinition,
  AutomationStatus,
  PropertyDefinition,
} from '@/components/automations/types';
import { ConfirmationDialog } from '@/components/board/confirmation-dialog';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationRuleCardProps {
  automation: AutomationDefinition;
  isSelected: boolean;
  properties: PropertyDefinition[];
  statuses: AutomationStatus[];
  onDelete: (id: string) => Promise<boolean>;
  onEdit: (id: string) => void;
}

/** Formats a stored property value for a natural-language rule summary. */
function formatPropertyValue(value: AutomationDefinition['propertyValue']) {
  if (value === null) return '';
  return Array.isArray(value) ? value.join(', ') : String(value);
}

/** Renders one scannable rule with execution state and explicit actions. */
export function AutomationRuleCard({
  automation,
  isSelected,
  properties,
  statuses,
  onDelete,
  onEdit,
}: AutomationRuleCardProps): React.JSX.Element {
  const { t } = useI18n();
  const dateFormatter = useDateFormatter({
    dateStyle: 'medium',
    timeZone: 'UTC',
  });
  const triggerStatus = statuses.find(
    (status) => status.id === automation.triggerStatusId,
  );
  const taskStatus = statuses.find(
    (status) => status.id === automation.taskStatusId,
  );
  const property = properties.find((item) => item.id === automation.propertyId);
  const isScheduled = automation.triggerType === 'SCHEDULED';
  const date = automation.scheduledAt
    ? dateFormatter.format(new Date(automation.scheduledAt))
    : '';
  const summary = isScheduled
    ? t('automation.scheduledRule', {
        date,
        title: automation.taskTitleTemplate ?? '',
        status: taskStatus?.name ?? t('automation.unknownStatus'),
      })
    : t('automation.rule', {
        status: triggerStatus?.name ?? t('automation.unknownStatus'),
        action:
          automation.actionType === 'SET_PROPERTY_VALUE'
            ? t('automation.actionProperty')
            : t('automation.actionCompletion'),
        property: property ? ` · ${property.name}` : '',
        value: property
          ? ` = ${formatPropertyValue(automation.propertyValue)}`
          : '',
      });
  const state = isScheduled
    ? automation.executedAt
      ? t('automation.executedAt', {
          date: dateFormatter.format(new Date(automation.executedAt)),
        })
      : t('automation.scheduled')
    : t('automation.alwaysOn');

  return (
    <Card
      className="automation-rule-card"
      data-selected={isSelected || undefined}
      variant="default"
    >
      <Card.Content className="automation-rule-content">
        <div className="automation-rule-icon" data-scheduled={isScheduled}>
          {isScheduled ? (
            <ScheduledIcon className="size-5" />
          ) : (
            <RuleIcon className="size-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Card.Title>{automation.name}</Card.Title>
          <Card.Description className="automation-rule-summary">
            {summary}
          </Card.Description>
        </div>
      </Card.Content>
      <Card.Footer className="automation-rule-footer">
        <span
          className="automation-rule-state"
          data-complete={Boolean(automation.executedAt) || undefined}
        >
          <span aria-hidden="true" />
          {state}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => onEdit(automation.id)}
          >
            <EditRuleIcon className="size-4" />
            {t('common.edit')}
          </Button>
          <ConfirmationDialog
            body={t('automation.deleteBody')}
            confirmLabel={t('common.delete')}
            heading={t('automation.deleteHeading', { name: automation.name })}
            triggerLabel={t('common.delete')}
            triggerVariant="ghost"
            onConfirm={() => onDelete(automation.id)}
          />
        </div>
      </Card.Footer>
    </Card>
  );
}
