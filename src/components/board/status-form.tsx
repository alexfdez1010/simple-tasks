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

import { StatusColorPicker } from '@/components/board/status-color-picker';
import type { MutationResult, StatusValues } from '@/components/board/types';

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
  const [values, setValues] = useState(initialValues);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Validates and persists the workflow state. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = values.name.trim();
    const color = values.color.toUpperCase();
    if (!name || !HEX_COLOR_PATTERN.test(color)) {
      setError('Enter a name and a color in #RRGGBB format.');
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await onSave({ ...values, name, color });
    setIsPending(false);
    if (!result.success)
      setError(result.error ?? 'The status could not be saved.');
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
          <Label>Name</Label>
          <Input maxLength={60} placeholder="To do" />
        </TextField>
        <StatusColorPicker
          value={values.color}
          onChange={(color) => setValues((current) => ({ ...current, color }))}
        />
      </div>

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
          Terminal status
        </Checkbox.Content>
        <Description>Shows only the 20 most recent tasks.</Description>
      </Checkbox>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onPress={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" isPending={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
