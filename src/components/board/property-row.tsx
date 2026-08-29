'use client';

import { Button, Card } from '@heroui/react';
import { useState } from 'react';

import { ChevronIcon, EditIcon } from '@/components/board/icons';
import { PropertyForm } from '@/components/board/property-form';
import type {
  MutationResult,
  PropertyDefinition,
  PropertyValues,
} from '@/components/board/types';

interface PropertyRowProps {
  property: PropertyDefinition;
  isFirst: boolean;
  isLast: boolean;
  onSave: (values: PropertyValues) => Promise<MutationResult>;
  onDelete: () => Promise<MutationResult>;
  onReorder: (direction: -1 | 1) => Promise<MutationResult>;
}

const TYPE_LABELS = {
  TEXT: 'Text',
  NUMBER: 'Number',
  DATE: 'Date',
  SELECT: 'Select',
  MULTI_SELECT: 'Multi-select',
} as const;

/**
 * Renders one property definition with edit, order, and delete actions.
 *
 * @param props - Definition state and mutation callbacks.
 * @returns A compact summary card or inline property form.
 */
export function PropertyRow({
  property,
  isFirst,
  isLast,
  onSave,
  onDelete,
  onReorder,
}: PropertyRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Saves this definition and closes the inline editor on success. */
  async function handleSave(values: PropertyValues) {
    const result = await onSave(values);
    if (result.success) setIsEditing(false);
    return result;
  }

  /** Confirms deletion before removing the definition and its task values. */
  async function handleDelete() {
    if (!window.confirm(`Delete the “${property.name}” property?`)) return;
    const result = await onDelete();
    setError(
      result.success
        ? null
        : (result.error ?? 'The property could not be deleted.'),
    );
  }

  if (isEditing) {
    return (
      <Card className="border border-divider p-4" variant="secondary">
        <PropertyForm
          initialValues={{
            name: property.name,
            type: property.type,
            options: property.options,
          }}
          submitLabel="Save"
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      </Card>
    );
  }

  return (
    <Card className="gap-3 border border-divider p-4" variant="default">
      <div className="flex items-center gap-3">
        <Card.Header className="min-w-0 flex-1 gap-0">
          <Card.Title className="truncate text-base">
            {property.name}
          </Card.Title>
          <Card.Description>{TYPE_LABELS[property.type]}</Card.Description>
        </Card.Header>
        <div className="flex gap-1">
          <Button
            isIconOnly
            isDisabled={isFirst}
            size="sm"
            variant="ghost"
            aria-label={`Move ${property.name} up`}
            onPress={() => void onReorder(-1)}
          >
            <ChevronIcon className="size-4 -rotate-90" />
          </Button>
          <Button
            isIconOnly
            isDisabled={isLast}
            size="sm"
            variant="ghost"
            aria-label={`Move ${property.name} down`}
            onPress={() => void onReorder(1)}
          >
            <ChevronIcon className="size-4 rotate-90" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Edit ${property.name}`}
            onPress={() => setIsEditing(true)}
          >
            <EditIcon className="size-4" />
          </Button>
        </div>
      </div>
      <Button size="sm" variant="danger-soft" onPress={handleDelete}>
        Delete property
      </Button>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
