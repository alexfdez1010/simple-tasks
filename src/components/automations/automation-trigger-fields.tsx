'use client';

import { Label, ListBox, Select } from '@heroui/react';

import { changeAutomationTrigger } from '@/components/automations/automation-draft';
import type {
  AutomationStatus,
  AutomationValues,
} from '@/components/automations/types';
import { DatePickerField } from '@/components/board/date-picker-field';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationTriggerFieldsProps {
  statuses: AutomationStatus[];
  values: AutomationValues;
  onChange: (values: AutomationValues) => void;
}

/** Renders the trigger mode and its status or calendar selector. */
export function AutomationTriggerFields({
  statuses,
  values,
  onChange,
}: AutomationTriggerFieldsProps): React.JSX.Element {
  const { t } = useI18n();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Select
        selectedKey={values.triggerType}
        onSelectionChange={(triggerType) =>
          onChange(
            changeAutomationTrigger(
              values,
              String(triggerType) as AutomationValues['triggerType'],
              statuses,
            ),
          )
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
                  <span className="automation-status-option">
                    <span
                      className="automation-status-dot"
                      style={
                        {
                          '--status-color': status.color,
                        } as React.CSSProperties
                      }
                    />
                    {status.name}
                  </span>
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
