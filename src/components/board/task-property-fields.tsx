'use client';

import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from '@heroui/react';

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

        const inputType =
          property.type === 'DATE'
            ? 'date'
            : property.type === 'NUMBER'
              ? 'number'
              : 'text';
        return (
          <TextField
            key={property.id}
            type={inputType}
            value={Array.isArray(value) ? '' : String(value ?? '')}
            onChange={(nextValue) =>
              setValue(
                property.id,
                property.type === 'NUMBER' && nextValue !== ''
                  ? Number(nextValue)
                  : nextValue,
              )
            }
          >
            <Label>{property.name}</Label>
            <Input
              max={
                property.type === 'NUMBER' ? Number.MAX_SAFE_INTEGER : undefined
              }
              min={
                property.type === 'NUMBER'
                  ? -Number.MAX_SAFE_INTEGER
                  : undefined
              }
              maxLength={property.type === 'TEXT' ? 20_000 : undefined}
              step={property.type === 'NUMBER' ? 'any' : undefined}
            />
          </TextField>
        );
      })}
    </fieldset>
  );
}
