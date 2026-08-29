import { TaskPropertyType } from '@/generated/prisma';
import {
  MAX_PROPERTY_OPTIONS,
  MAX_TASK_PROPERTIES,
} from '@/lib/properties/limits';
import type { PropertyValue } from '@/lib/properties/types';
import { idSchema } from '@/lib/validation/common';
import { z } from 'zod';

const optionSchema = z.string().trim().min(1).max(80);
const optionsSchema = z
  .array(optionSchema)
  .max(MAX_PROPERTY_OPTIONS)
  .refine((options) => new Set(options).size === options.length, {
    message: 'Options must be unique.',
  });
const selectableTypes = new Set<TaskPropertyType>([
  TaskPropertyType.SELECT,
  TaskPropertyType.MULTI_SELECT,
]);

/** Adds type-dependent option errors to a property definition payload. */
function validateOptions(
  type: TaskPropertyType,
  options: string[] | undefined,
  context: z.RefinementCtx,
): void {
  if (selectableTypes.has(type) && (!options || options.length === 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selection properties require options.',
      path: ['options'],
    });
  }
  if (!selectableTypes.has(type) && options && options.length > 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'This property type does not support options.',
      path: ['options'],
    });
  }
}

export const createPropertySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: z.nativeEnum(TaskPropertyType),
    options: optionsSchema.optional(),
  })
  .superRefine((input, context) =>
    validateOptions(input.type, input.options, context),
  );

export const updatePropertySchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(80).optional(),
  type: z.nativeEnum(TaskPropertyType).optional(),
  options: optionsSchema.optional(),
});

export const reorderPropertiesSchema = z.object({
  propertyIds: z.array(idSchema).max(MAX_TASK_PROPERTIES),
});

export const taskPropertyValueInputSchema = z.object({
  propertyId: idSchema,
  value: z.union([
    z.string().max(20_000),
    z
      .number()
      .finite()
      .min(-Number.MAX_SAFE_INTEGER)
      .max(Number.MAX_SAFE_INTEGER),
    z.array(z.string().max(80)).max(MAX_PROPERTY_OPTIONS),
  ]),
});

export const setTaskPropertyValueSchema = taskPropertyValueInputSchema.extend({
  taskId: idSchema,
});

/** Parses one value according to its persisted property definition. */
export function parsePropertyValue(
  type: TaskPropertyType,
  options: string[],
  value: unknown,
): PropertyValue {
  if (type === TaskPropertyType.TEXT)
    return z.string().max(20_000).parse(value);
  if (type === TaskPropertyType.NUMBER)
    return z
      .number()
      .finite()
      .min(-Number.MAX_SAFE_INTEGER)
      .max(Number.MAX_SAFE_INTEGER)
      .parse(value);
  if (type === TaskPropertyType.DATE) return parseDateValue(value);
  if (type === TaskPropertyType.SELECT)
    return z.enum(options as [string, ...string[]]).parse(value);
  const selected = z.array(z.string()).max(MAX_PROPERTY_OPTIONS).parse(value);
  if (new Set(selected).size !== selected.length)
    throw new z.ZodError([
      { code: 'custom', message: 'Selected options must be unique.', path: [] },
    ]);
  return selected.map((item) =>
    z.enum(options as [string, ...string[]]).parse(item),
  );
}

/** Parses a calendar-only ISO date without accepting rollover dates. */
function parseDateValue(value: unknown): string {
  const date = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .parse(value);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  )
    throw new z.ZodError([
      { code: 'custom', message: 'The date is invalid.', path: [] },
    ]);
  return date;
}

/** Reports whether a type accepts configurable options. */
export function isSelectableProperty(type: TaskPropertyType): boolean {
  return selectableTypes.has(type);
}
