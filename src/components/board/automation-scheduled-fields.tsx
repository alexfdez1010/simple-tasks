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

import { TaskPropertyFields } from '@/components/board/task-property-fields';
import type {
  AutomationValues,
  BoardStatus,
  PropertyDefinition,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationScheduledFieldsProps {
  properties: PropertyDefinition[];
  statuses: BoardStatus[];
  values: AutomationValues;
  onChange: (values: AutomationValues) => void;
}

/** Renders the parameterized task template for a scheduled automation. */
export function AutomationScheduledFields({
  properties,
  statuses,
  values,
  onChange,
}: AutomationScheduledFieldsProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-secondary p-3 sm:col-span-2">
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
          className="min-h-24 font-mono text-sm"
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
      <TaskPropertyFields
        properties={properties}
        values={values.taskPropertyValues}
        onChange={(taskPropertyValues) =>
          onChange({ ...values, taskPropertyValues })
        }
      />
      <p className="text-xs text-muted">{t('automation.templateHint')}</p>
    </div>
  );
}
