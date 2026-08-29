import type {
  Prisma,
  TaskPropertyDefinition,
  TaskPropertyValue,
} from '@/generated/prisma';
import type {
  PropertyDefinition,
  TaskPropertyValueData,
} from '@/lib/properties/types';
import { conflict } from '@/lib/validation/errors';

/** Parses persisted property options into the public string-array contract. */
export function deserializeOptions(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))
    throw conflict('The stored property options are invalid.');
  return value as string[];
}

/** Converts a Prisma definition into its transport-safe representation. */
export function serializeProperty(
  property: TaskPropertyDefinition,
): PropertyDefinition {
  return { ...property, options: deserializeOptions(property.options) };
}

/** Converts a persisted task value into its public JSON-safe representation. */
export function serializeTaskPropertyValue(
  propertyValue: Pick<TaskPropertyValue, 'propertyId' | 'value'>,
): TaskPropertyValueData {
  const value = propertyValue.value;
  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    !(Array.isArray(value) && value.every((item) => typeof item === 'string'))
  ) {
    throw conflict('The stored property value is invalid.');
  }
  return { propertyId: propertyValue.propertyId, value };
}
