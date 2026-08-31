'use client';

import {
  Input,
  Label,
  ListBox,
  NumberField,
  Select,
  TextArea,
  TextField,
} from '@heroui/react';

import type {
  AutomationStatus,
  AutomationValues,
  PropertyDefinition,
} from '@/components/automations/types';
import { TaskPropertyFields } from '@/components/board/task-property-fields';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationScheduledFieldsProps {
  properties: PropertyDefinition[];
  statuses: AutomationStatus[];
  values: AutomationValues;
  onChange: (values: AutomationValues) => void;
}

/** Renders the task template produced by a scheduled automation. */
export function AutomationScheduledFields({
  properties,
  statuses,
  values,
  onChange,
}: AutomationScheduledFieldsProps): React.JSX.Element {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <TextField
        isRequired
        value={values.taskTitleTemplate ?? ''}
        onChange={(taskTitleTemplate) =>
          onChange({ ...values, taskTitleTemplate })
        }
      >
        <Label>{t('automation.taskTitleTemplate')}</Label>
        <Input
          maxLength={160}
          placeholder={t('automation.taskTitlePlaceholder')}
        />
      </TextField>
      <TextField
        value={values.taskDescriptionTemplate ?? ''}
        onChange={(taskDescriptionTemplate) =>
          onChange({ ...values, taskDescriptionTemplate })
        }
      >
        <Label>{t('automation.taskDescriptionTemplate')}</Label>
        <TextArea
          className="min-h-28 font-mono text-sm"
          maxLength={20_000}
          placeholder={t('automation.taskDescriptionPlaceholder')}
        />
      </TextField>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          selectedKey={values.taskStatusId ?? undefined}
          onSelectionChange={(taskStatusId) =>
            onChange({ ...values, taskStatusId: String(taskStatusId) })
          }
        >
          <Label>{t('automation.taskStatus')}</Label>
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
        <NumberField
          minValue={-3650}
          maxValue={3650}
          step={1}
          value={values.taskDueDateOffsetDays ?? 0}
          onChange={(taskDueDateOffsetDays) =>
            onChange({
              ...values,
              taskDueDateOffsetDays: taskDueDateOffsetDays ?? 0,
            })
          }
        >
          <Label>{t('automation.taskDueDateOffset')}</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
      </div>
      <div className="automation-template-properties">
        <TaskPropertyFields
          properties={properties}
          values={values.taskPropertyValues}
          onChange={(taskPropertyValues) =>
            onChange({ ...values, taskPropertyValues })
          }
        />
      </div>
      <p className="text-xs leading-5 text-muted">
        {t('automation.templateHint')}
      </p>
    </div>
  );
}
