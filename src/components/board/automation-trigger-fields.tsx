'use client';

import { Label, ListBox, Select } from '@heroui/react';

import { DatePickerField } from '@/components/board/date-picker-field';
import type { AutomationValues, BoardStatus } from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationTriggerFieldsProps {
  statuses: BoardStatus[];
  values: AutomationValues;
  onChange: (values: AutomationValues) => void;
}

/** Renders the trigger mode and its status or calendar date selector. */
export function AutomationTriggerFields({
  statuses,
  values,
  onChange,
}: AutomationTriggerFieldsProps) {
  const { t } = useI18n();
  const fallbackStatusId = statuses[0]?.id ?? '';

  /** Switches modes and clears fields that belong to the previous trigger. */
  function changeTrigger(triggerType: AutomationValues['triggerType']) {
    const isScheduled = triggerType === 'SCHEDULED';
    onChange({
      ...values,
      triggerType,
      triggerStatusId: isScheduled
        ? null
        : (values.triggerStatusId ?? fallbackStatusId),
      scheduledAt: isScheduled ? values.scheduledAt : null,
      actionType: isScheduled ? 'CREATE_TASK' : 'SET_COMPLETION_DATE_TODAY',
      propertyId: isScheduled ? null : values.propertyId,
      propertyValue: isScheduled ? null : values.propertyValue,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        selectedKey={values.triggerType}
        onSelectionChange={(triggerType) =>
          changeTrigger(String(triggerType) as AutomationValues['triggerType'])
        }
      >
        <Label>{t('automation.triggerType')}</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item
              id="STATUS_CHANGE"
              textValue={t('automation.triggerStatusMode')}
            >
              {t('automation.triggerStatusMode')}
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item
              id="SCHEDULED"
              textValue={t('automation.triggerScheduledMode')}
            >
              {t('automation.triggerScheduledMode')}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      {values.triggerType === 'SCHEDULED' ? (
        <DatePickerField
          description={t('automation.scheduledDateHint')}
          label={t('automation.scheduledDate')}
          name="automation-scheduled-date"
          value={values.scheduledAt ?? ''}
          onChange={(scheduledAt) => onChange({ ...values, scheduledAt })}
        />
      ) : (
        <Select
          selectedKey={values.triggerStatusId ?? undefined}
          onSelectionChange={(triggerStatusId) =>
            onChange({ ...values, triggerStatusId: String(triggerStatusId) })
          }
        >
          <Label>{t('automation.triggerStatus')}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {statuses.map((status) => (
                <ListBox.Item
                  key={status.id}
                  id={status.id}
                  textValue={status.name}
                >
                  {status.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      )}
    </div>
  );
}
