'use client';

import { Button, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';

import { StatisticConfigurationFields } from '@/components/statistics/statistic-configuration-fields';
import { getStatisticsCopy } from '@/components/statistics/copy';
import { NUMERIC_MEASURES } from '@/components/statistics/statistic-options';
import { StatisticStatusFilter } from '@/components/statistics/statistic-status-filter';
import { useI18n } from '@/lib/i18n/provider';
import type { PropertyDefinition } from '@/lib/properties/types';
import type {
  CreateStatisticInput,
  StatisticStatusRecord,
} from '@/lib/statistics/types';

interface StatisticFormProps {
  initialValues: CreateStatisticInput;
  properties: PropertyDefinition[];
  statuses: StatisticStatusRecord[];
  submitLabel: string;
  onCancel: () => void;
  onSave: (
    values: CreateStatisticInput,
  ) => Promise<{ error?: string; success: boolean }>;
}

/** Returns the first visible dependency validation error for a statistic draft. */
function getDraftError(
  values: CreateStatisticInput,
  language: 'en' | 'es',
): string | null {
  if (!values.name.trim()) return getStatisticsCopy(language, 'requiredName');
  if (NUMERIC_MEASURES.has(values.measure) && !values.measurePropertyId) {
    return getStatisticsCopy(language, 'requiredProperty');
  }
  if (values.groupBy === 'PROPERTY' && !values.groupPropertyId) {
    return getStatisticsCopy(language, 'requiredProperty');
  }
  if (values.dateField === 'PROPERTY' && !values.datePropertyId) {
    return getStatisticsCopy(language, 'requiredDateProperty');
  }
  return null;
}

/** Renders the complete conditional editor for one configurable statistic. */
export function StatisticForm({
  initialValues,
  properties,
  statuses,
  submitLabel,
  onCancel,
  onSave,
}: StatisticFormProps): React.JSX.Element {
  const { language } = useI18n();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  /** Validates visible dependencies and persists the current draft. */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const draftError = getDraftError(values, language);
    if (draftError) return setError(draftError);
    setIsPending(true);
    setError(null);
    const result = await onSave({ ...values, name: values.name.trim() });
    setIsPending(false);
    if (!result.success) {
      setError(result.error ?? getStatisticsCopy(language, 'saveFailed'));
    }
  }

  return (
    <form className="statistics-form" onSubmit={handleSubmit}>
      <TextField
        isRequired
        value={values.name}
        onChange={(name) => setValues((current) => ({ ...current, name }))}
      >
        <Label>{getStatisticsCopy(language, 'name')}</Label>
        <Input
          maxLength={100}
          placeholder={getStatisticsCopy(language, 'namePlaceholder')}
        />
      </TextField>
      <StatisticConfigurationFields
        properties={properties}
        values={values}
        onChange={setValues}
      />
      <StatisticStatusFilter
        statuses={statuses}
        value={values.statusIds}
        onChange={(statusIds) =>
          setValues((current) => ({ ...current, statusIds }))
        }
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="statistics-form-actions">
        <Button type="button" variant="ghost" onPress={onCancel}>
          {getStatisticsCopy(language, 'cancel')}
        </Button>
        <Button type="submit" isPending={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
