'use client';

import { Button, Card } from '@heroui/react';
import { useState } from 'react';

import { ChevronIcon, EditIcon } from '@/components/board/icons';
import { ConfirmationDialog } from '@/components/board/confirmation-dialog';
import { PropertyForm } from '@/components/board/property-form';
import type {
  MutationResult,
  PropertyDefinition,
  PropertyValues,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';
import type { TranslationKey } from '@/lib/i18n/translations';

interface PropertyRowProps {
  property: PropertyDefinition;
  isFirst: boolean;
  isLast: boolean;
  onSave: (values: PropertyValues) => Promise<MutationResult>;
  onDelete: () => Promise<MutationResult>;
  onReorder: (direction: -1 | 1) => Promise<MutationResult>;
}

const TYPE_LABELS: Record<PropertyDefinition['type'], TranslationKey> = {
  TEXT: 'property.typeText',
  NUMBER: 'property.typeNumber',
  DATE: 'property.typeDate',
  SELECT: 'property.typeSelect',
  MULTI_SELECT: 'property.typeMultiSelect',
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
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Saves this definition and closes the inline editor on success. */
  async function handleSave(values: PropertyValues) {
    const result = await onSave(values);
    if (result.success) setIsEditing(false);
    return result;
  }

  /** Deletes the definition and reports whether the confirmation may close. */
  async function handleDelete(): Promise<boolean> {
    const result = await onDelete();
    setError(
      result.success ? null : (result.error ?? t('property.deleteFallback')),
    );
    return result.success;
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
          submitLabel={t('common.save')}
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
          <Card.Description>{t(TYPE_LABELS[property.type])}</Card.Description>
        </Card.Header>
        <div className="flex gap-1">
          <Button
            isIconOnly
            isDisabled={isFirst}
            size="sm"
            variant="ghost"
            aria-label={t('property.moveUp', { name: property.name })}
            onPress={() => void onReorder(-1)}
          >
            <ChevronIcon className="size-4 -rotate-90" />
          </Button>
          <Button
            isIconOnly
            isDisabled={isLast}
            size="sm"
            variant="ghost"
            aria-label={t('property.moveDown', { name: property.name })}
            onPress={() => void onReorder(1)}
          >
            <ChevronIcon className="size-4 rotate-90" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={t('property.edit', { name: property.name })}
            onPress={() => setIsEditing(true)}
          >
            <EditIcon className="size-4" />
          </Button>
        </div>
      </div>
      <ConfirmationDialog
        body={t('property.deleteBody')}
        confirmLabel={t('property.delete')}
        heading={t('property.deleteHeading', { name: property.name })}
        triggerAriaLabel={t('property.deleteAria', { name: property.name })}
        triggerLabel={t('property.delete')}
        triggerVariant="danger-soft"
        onConfirm={handleDelete}
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
