'use client';

import {
  Button,
  Description,
  Input,
  Label,
  TextArea,
  TextField,
} from '@heroui/react';
import { useState } from 'react';

import { DatePickerField } from '@/components/board/date-picker-field';
import { Markdown } from '@/components/board/markdown';
import { TaskPropertyFields } from '@/components/board/task-property-fields';
import type {
  MutationResult,
  PropertyDefinition,
  TaskValues,
} from '@/components/board/types';

interface TaskFormProps {
  id: string;
  initialValues: TaskValues;
  properties: PropertyDefinition[];
  onSave: (values: TaskValues) => Promise<MutationResult>;
  onSaved: () => void;
}

/**
 * Renders and manages the create/edit task fields.
 *
 * @param props - Form identity, values, property definitions, and callbacks.
 * @returns An accessible task form with a safe Markdown preview.
 */
export function TaskForm({
  id,
  initialValues,
  properties,
  onSave,
  onSaved,
}: TaskFormProps) {
  const [values, setValues] = useState(initialValues);
  const [showPreview, setShowPreview] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Submits current values while retaining them if persistence fails. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.title.trim()) {
      setError('Enter a task title.');
      return;
    }

    setError(null);
    setIsPending(true);
    const result = await onSave({ ...values, title: values.title.trim() });
    setIsPending(false);
    if (!result.success) {
      setError(result.error ?? 'The changes could not be saved.');
      return;
    }
    onSaved();
  }

  return (
    <form id={id} className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <TextField
        isRequired
        name="title"
        value={values.title}
        onChange={(title) => setValues((current) => ({ ...current, title }))}
      >
        <Label>Title</Label>
        <Input autoFocus maxLength={160} placeholder="What needs to be done" />
      </TextField>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={`${id}-description`}>Description</Label>
          <div
            className="flex gap-1"
            role="group"
            aria-label="Description mode"
          >
            <Button
              type="button"
              aria-pressed={!showPreview}
              size="sm"
              variant={showPreview ? 'ghost' : 'secondary'}
              onPress={() => setShowPreview(false)}
            >
              Write
            </Button>
            <Button
              type="button"
              aria-pressed={showPreview}
              size="sm"
              variant={showPreview ? 'secondary' : 'ghost'}
              onPress={() => setShowPreview(true)}
            >
              Preview
            </Button>
          </div>
        </div>
        {showPreview ? (
          <div className="min-h-36 rounded-xl border border-divider bg-surface-secondary p-4">
            <Markdown isPreview>{values.description}</Markdown>
          </div>
        ) : (
          <TextField
            aria-label="Description"
            name="description"
            value={values.description}
            onChange={(description) =>
              setValues((current) => ({ ...current, description }))
            }
          >
            <TextArea
              id={`${id}-description`}
              className="min-h-36 font-mono text-sm"
              maxLength={20_000}
              placeholder="Supports Markdown"
            />
            <Description>Optional · Supports Markdown</Description>
          </TextField>
        )}
      </div>

      <div className="sm:max-w-72">
        <DatePickerField
          description="Optional"
          label="Due date"
          name="dueDate"
          value={values.dueDate}
          onChange={(dueDate) =>
            setValues((current) => ({ ...current, dueDate }))
          }
        />
      </div>

      <TaskPropertyFields
        properties={properties}
        values={values.propertyValues ?? []}
        onChange={(propertyValues) =>
          setValues((current) => ({ ...current, propertyValues }))
        }
      />

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" hidden disabled={isPending} aria-hidden="true" />
    </form>
  );
}
