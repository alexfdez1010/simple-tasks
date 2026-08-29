'use client';

import {
  Button,
  Input,
  Label,
  ListBox,
  NumberField,
  Select,
  TextField,
} from '@heroui/react';

import { DatePickerField } from '@/components/board/date-picker-field';
import type {
  PropertyDefinition,
  TaskPropertyValueData,
} from '@/components/board/types';

interface TaskPropertyFieldsProps {
  properties: PropertyDefinition[];
  values: TaskPropertyValueData[];
  onChange: (values: TaskPropertyValueData[]) => void;
}

/** Returns the current controlled value for one property definition. */
function getValue(
  values: TaskPropertyValueData[],
  propertyId: string,
): TaskPropertyValueData['value'] | undefined {
  return values.find((entry) => entry.propertyId === propertyId)?.value;
}

/** Returns whether a draft value should be omitted from persistence. */
function isEmpty(value: TaskPropertyValueData['value']): boolean {
  return Array.isArray(value)
    ? value.length === 0
    : String(value).trim() === '';
}

/**
 * Renders controlled task fields from the configured property definitions.
 *
 * @param props - Ordered definitions, draft values, and update callback.
 * @returns Type-appropriate HeroUI fields for every configured property.
 */
export function TaskPropertyFields({
  properties,
  values,
  onChange,
}: TaskPropertyFieldsProps) {
  /** Replaces or removes one property value in the draft. */
  function setValue(propertyId: string, value: TaskPropertyValueData['value']) {
    const remaining = values.filter((entry) => entry.propertyId !== propertyId);
    onChange(
      isEmpty(value) ? remaining : [...remaining, { propertyId, value }],
    );
  }

  if (properties.length === 0) return null;

  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="col-span-full mb-1 text-sm font-semibold">
        Properties
      </legend>
      {properties.map((property) => {
        const value = getValue(values, property.id);

        if (property.type === 'SELECT' || property.type === 'MULTI_SELECT') {
          const isMultiple = property.type === 'MULTI_SELECT';
          const selected = isMultiple
            ? Array.isArray(value)
              ? value
              : []
            : typeof value === 'string'
              ? value
              : null;
          const hasSelection = Array.isArray(selected)
            ? selected.length > 0
            : selected !== null;
          return (
            <div className="flex min-w-0 items-end gap-2" key={property.id}>
              <Select
                className="min-w-0 flex-1"
                placeholder="No value"
                selectionMode={isMultiple ? 'multiple' : 'single'}
                value={selected}
                onChange={(selection) =>
                  setValue(
                    property.id,
                    isMultiple
                      ? (selection as string[])
                      : String(selection ?? ''),
                  )
                }
              >
                <Label>{property.name}</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {property.options.map((option) => (
                      <ListBox.Item key={option} id={option} textValue={option}>
                        {option}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              {hasSelection ? (
                <Button
                  isIconOnly
                  type="button"
                  variant="ghost"
                  aria-label={`Clear ${property.name}`}
                  onPress={() => setValue(property.id, isMultiple ? [] : '')}
                >
                  <span aria-hidden="true">×</span>
                </Button>
              ) : null}
            </div>
          );
        }

        if (property.type === 'DATE') {
          return (
            <DatePickerField
              key={property.id}
              label={property.name}
              name={`property-${property.id}`}
              value={typeof value === 'string' ? value : ''}
              onChange={(date) => setValue(property.id, date)}
            />
          );
        }

        if (property.type === 'NUMBER') {
          return (
            <NumberField
              key={property.id}
              maxValue={Number.MAX_SAFE_INTEGER}
              minValue={-Number.MAX_SAFE_INTEGER}
              step={0.1}
              value={typeof value === 'number' ? value : undefined}
              onChange={(number) => setValue(property.id, number ?? '')}
            >
              <Label>{property.name}</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
          );
        }

        return (
          <TextField
            key={property.id}
            value={Array.isArray(value) ? '' : String(value ?? '')}
            onChange={(nextValue) => setValue(property.id, nextValue)}
          >
            <Label>{property.name}</Label>
            <Input maxLength={20_000} />
          </TextField>
        );
      })}
    </fieldset>
  );
}
