'use client';

import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from '@heroui/react';
import { useState } from 'react';

import { AutomationActionFields } from '@/components/board/automation-action-fields';
import type {
  AutomationValues,
  BoardStatus,
  MutationResult,
  PropertyDefinition,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationFormProps {
  statuses: BoardStatus[];
  properties: PropertyDefinition[];
  initialValues: AutomationValues;
  submitLabel: string;
  onCancel?: () => void;
  onSave: (values: AutomationValues) => Promise<MutationResult>;
}

/** Edits one human-readable status transition and its typed action. */
export function AutomationForm({
  statuses,
  properties,
  initialValues,
  submitLabel,
  onCancel,
  onSave,
}: AutomationFormProps) {
  const { t } = useI18n();
  const [values, setValues] = useState(initialValues);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Validates and persists a normalized automation draft. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.name.trim()) return setError(t('automation.enterName'));
    if (
      values.actionType === 'SET_PROPERTY_VALUE' &&
      (!values.propertyId || values.propertyValue === null)
    ) {
      return setError(t('automation.chooseProperty'));
    }
    setError(null);
    setIsPending(true);
    const result = await onSave({ ...values, name: values.name.trim() });
    setIsPending(false);
    if (!result.success) setError(result.error ?? t('automation.saveFallback'));
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <TextField
        isRequired
        value={values.name}
        onChange={(name) => setValues((current) => ({ ...current, name }))}
      >
        <Label>{t('automation.name')}</Label>
        <Input maxLength={120} placeholder={t('automation.namePlaceholder')} />
      </TextField>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          selectedKey={values.triggerStatusId}
          onSelectionChange={(triggerStatusId) =>
            setValues((current) => ({
              ...current,
              triggerStatusId: String(triggerStatusId),
            }))
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
        <AutomationActionFields
          properties={properties}
          values={values}
          onChange={setValues}
        />
      </div>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onPress={onCancel}>
            {t('common.cancel')}
          </Button>
        ) : null}
        <Button type="submit" isPending={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
