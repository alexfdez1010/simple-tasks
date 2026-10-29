'use client';

import {
  Button,
  Checkbox,
  Description,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import { useState } from 'react';

import { StatisticSelect } from '@/components/statistics/statistic-select';
import { StatusColorPicker } from '@/components/board/status-color-picker';
import type { MutationResult, StatusValues } from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface StatusFormProps {
  initialValues: StatusValues;
  submitLabel: string;
  onCancel?: () => void;
  onSave: (values: StatusValues) => Promise<MutationResult>;
}

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i;

/**
 * Renders a focused workflow-state form.
 *
 * @param props - Initial state values, labels, and persistence callbacks.
 * @returns A validated form for name, colour, and terminal behavior.
 */
export function StatusForm({
  initialValues,
  submitLabel,
  onCancel,
  onSave,
}: StatusFormProps) {
  const { t } = useI18n();
  const [values, setValues] = useState(initialValues);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Validates and persists the workflow state. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = values.name.trim();
    const color = values.color.toUpperCase();
    if (!name || !HEX_COLOR_PATTERN.test(color)) {
      setError(t('status.invalidColor'));
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await onSave({ ...values, name, color });
    setIsPending(false);
    if (!result.success) setError(result.error ?? t('status.saveFallback'));
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <TextField
          isRequired
          name="statusName"
          value={values.name}
          onChange={(name) => setValues((current) => ({ ...current, name }))}
        >
          <Label>{t('status.name')}</Label>
          <Input maxLength={60} placeholder={t('status.namePlaceholder')} />
        </TextField>
        <StatusColorPicker
          value={values.color}
          onChange={(color) => setValues((current) => ({ ...current, color }))}
        />
      </div>

      {!values.isTerminal ? (
        <StatisticSelect
          label={t('status.workType')}
          value={values.workType ?? 'READY'}
          onChange={(workType) =>
            setValues((current) => ({
              ...current,
              workType: workType as StatusValues['workType'],
            }))
          }
          options={[
            { id: 'READY', label: t('status.ready') },
            { id: 'WORKING', label: t('status.working') },
            { id: 'BLOCKED', label: t('status.blocked') },
            { id: 'REVIEW', label: t('status.review') },
          ]}
        />
      ) : null}

      <Checkbox
        isSelected={values.isTerminal}
        onChange={(setIsTerminal) =>
          setValues((current) => ({ ...current, isTerminal: setIsTerminal }))
        }
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          {t('status.terminal')}
        </Checkbox.Content>
        <Description>{t('status.terminalDescription')}</Description>
      </Checkbox>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onPress={onCancel}>
            {t('status.cancel')}
          </Button>
        ) : null}
        <Button type="submit" isPending={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
