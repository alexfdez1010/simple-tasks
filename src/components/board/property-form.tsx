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

import { PropertyOptionsEditor } from '@/components/board/property-options-editor';
import type { MutationResult, PropertyValues } from '@/components/board/types';
import type { TaskPropertyType } from '@/generated/prisma';

interface PropertyFormProps {
  initialValues: PropertyValues;
  submitLabel: string;
  onCancel?: () => void;
  onSave: (values: PropertyValues) => Promise<MutationResult>;
}

const PROPERTY_TYPES: Array<{ id: TaskPropertyType; label: string }> = [
  { id: 'TEXT', label: 'Text' },
  { id: 'NUMBER', label: 'Number' },
  { id: 'DATE', label: 'Date' },
  { id: 'SELECT', label: 'Select' },
  { id: 'MULTI_SELECT', label: 'Multi-select' },
];

/** Returns whether a property type requires configured choices. */
function hasOptions(type: TaskPropertyType): boolean {
  return type === 'SELECT' || type === 'MULTI_SELECT';
}

/**
 * Edits one configurable property definition.
 *
 * @param props - Initial values, action labels, and persistence callbacks.
 * @returns A validated HeroUI property form.
 */
export function PropertyForm({
  initialValues,
  submitLabel,
  onCancel,
  onSave,
}: PropertyFormProps) {
  const [values, setValues] = useState(initialValues);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Validates and persists the normalized property definition. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = values.name.trim();
    const options = hasOptions(values.type)
      ? values.options.map((option) => option.trim()).filter(Boolean)
      : [];
    if (!name) {
      setError('Enter a property name.');
      return;
    }
    if (hasOptions(values.type) && options.length === 0) {
      setError('Add at least one option.');
      return;
    }
    if (new Set(options).size !== options.length) {
      setError('Options must be unique.');
      return;
    }

    setError(null);
    setIsPending(true);
    const result = await onSave({ name, type: values.type, options });
    setIsPending(false);
    if (!result.success) {
      setError(result.error ?? 'The property could not be saved.');
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          isRequired
          value={values.name}
          onChange={(name) => setValues((current) => ({ ...current, name }))}
        >
          <Label>Name</Label>
          <Input maxLength={80} placeholder="Priority" />
        </TextField>
        <Select
          selectedKey={values.type}
          onSelectionChange={(type) =>
            setValues((current) => ({
              ...current,
              type: String(type) as TaskPropertyType,
            }))
          }
        >
          <Label>Type</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {PROPERTY_TYPES.map((type) => (
                <ListBox.Item key={type.id} id={type.id} textValue={type.label}>
                  {type.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {hasOptions(values.type) ? (
        <PropertyOptionsEditor
          options={values.options}
          onChange={(options) =>
            setValues((current) => ({ ...current, options }))
          }
        />
      ) : null}

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
