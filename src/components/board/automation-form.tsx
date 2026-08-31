'use client';

import { Button, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';

import { AutomationActionFields } from '@/components/board/automation-action-fields';
import { AutomationTriggerFields } from '@/components/board/automation-trigger-fields';
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

/** Edits one status-transition or scheduled automation and its typed action. */
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
    if (values.triggerType === 'SCHEDULED' && !values.scheduledAt) {
      return setError(t('automation.chooseScheduledDate'));
    }
    if (
      values.triggerType === 'SCHEDULED' &&
      (!values.taskTitleTemplate?.trim() || !values.taskStatusId)
    ) {
      return setError(t('automation.completeTaskTemplate'));
    }
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
        <AutomationTriggerFields
          statuses={statuses}
          values={values}
          onChange={setValues}
        />
        <AutomationActionFields
          statuses={statuses}
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
