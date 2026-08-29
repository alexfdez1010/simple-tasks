'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';

import { PropertyForm } from '@/components/board/property-form';
import { PropertyRow } from '@/components/board/property-row';
import type {
  MutationResult,
  PropertyDefinition,
  PropertyValues,
} from '@/components/board/types';

interface PropertySettingsProps {
  properties: PropertyDefinition[];
  onCreate: (values: PropertyValues) => Promise<MutationResult>;
  onUpdate: (
    propertyId: string,
    values: PropertyValues,
  ) => Promise<MutationResult>;
  onDelete: (propertyId: string) => Promise<MutationResult>;
  onReorder: (propertyId: string, direction: -1 | 1) => Promise<MutationResult>;
}

const NEW_PROPERTY_VALUES: PropertyValues = {
  name: '',
  type: 'TEXT',
  options: [],
};

/**
 * Renders the property-definition manager used inside board settings.
 *
 * @param props - Current definitions and their mutation callbacks.
 * @returns The ordered property list and its creation form.
 */
export function PropertySettings({
  properties,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: PropertySettingsProps) {
  const [isCreating, setIsCreating] = useState(false);

  /** Creates a property and closes the form after successful persistence. */
  async function handleCreate(values: PropertyValues) {
    const result = await onCreate(values);
    if (result.success) setIsCreating(false);
    return result;
  }

  return (
    <section
      className="flex flex-col gap-4"
      aria-labelledby="properties-heading"
    >
      <div>
        <h2 id="properties-heading" className="font-semibold">
          Properties
        </h2>
        <p className="text-sm text-muted">Additional task fields.</p>
      </div>
      <div className="flex flex-col gap-3">
        {properties.map((property, index) => (
          <PropertyRow
            key={property.id}
            property={property}
            isFirst={index === 0}
            isLast={index === properties.length - 1}
            onSave={(values) => onUpdate(property.id, values)}
            onDelete={() => onDelete(property.id)}
            onReorder={(direction) => onReorder(property.id, direction)}
          />
        ))}
      </div>
      {properties.length === 0 && !isCreating ? (
        <p className="rounded-xl border border-dashed border-divider p-4 text-center text-sm text-muted">
          No properties
        </p>
      ) : null}
      {isCreating ? (
        <div className="rounded-2xl border border-divider bg-surface-secondary p-4">
          <PropertyForm
            initialValues={NEW_PROPERTY_VALUES}
            submitLabel="Create property"
            onCancel={() => setIsCreating(false)}
            onSave={handleCreate}
          />
        </div>
      ) : (
        <Button variant="secondary" onPress={() => setIsCreating(true)}>
          Add property
        </Button>
      )}
    </section>
  );
}
