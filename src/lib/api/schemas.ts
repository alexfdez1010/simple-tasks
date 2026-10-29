import { z } from 'zod';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  reorderTasksSchema,
} from '@/lib/validation/tasks';
import {
  createStatusSchema,
  updateStatusSchema,
  reorderStatusesSchema,
} from '@/lib/validation/statuses';
import {
  createPropertySchema,
  updatePropertySchema,
  reorderPropertiesSchema,
  taskPropertyValueInputSchema,
} from '@/lib/validation/properties';
import { MAX_TASK_PROPERTIES } from '@/lib/properties/limits';
import { idSchema } from '@/lib/validation/common';

const values = z
  .array(taskPropertyValueInputSchema.strict())
  .max(MAX_TASK_PROPERTIES)
  .optional();
const date = z
  .string()
  .datetime({ offset: true })
  .refine(
    (value) => Number.isFinite(Date.parse(value)),
    'Use a valid ISO 8601 timestamp.',
  )
  .nullable();
export const taskCreate = createTaskSchema
  .extend({ dueDate: date.optional(), propertyValues: values })
  .strict();
export const taskUpdate = updateTaskSchema
  .innerType()
  .omit({ id: true })
  .extend({ dueDate: date.optional(), propertyValues: values })
  .strict()
  .refine(
    (value) => (value.statusId === undefined) === (value.index === undefined),
    {
      message: 'Status and index must be provided together.',
      path: ['statusId'],
    },
  );
export const taskMove = moveTaskSchema.omit({ id: true }).strict();
export const tasksReorder = reorderTasksSchema
  .omit({ statusId: true })
  .strict()
  .refine((input) => new Set(input.taskIds).size === input.taskIds.length, {
    message: 'Include every id exactly once.',
    path: ['taskIds'],
  });
export const statusCreate = createStatusSchema.strict();
export const statusUpdate = updateStatusSchema.omit({ id: true }).strict();
export const statusesReorder = reorderStatusesSchema
  .strict()
  .refine((input) => new Set(input.statusIds).size === input.statusIds.length, {
    message: 'Include every id exactly once.',
    path: ['statusIds'],
  });
export const propertyCreate = createPropertySchema.innerType().strict();
export const propertyUpdate = updatePropertySchema.omit({ id: true }).strict();
export const propertiesReorder = reorderPropertiesSchema
  .strict()
  .refine(
    (input) => new Set(input.propertyIds).size === input.propertyIds.length,
    { message: 'Include every id exactly once.', path: ['propertyIds'] },
  );
export const propertyValue = taskPropertyValueInputSchema
  .pick({ value: true })
  .strict();
export const emptyInput = z.object({}).strict();
export const taskQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .max(256)
      .optional(),
    assigneeId: idSchema.optional(),
    projectId: idSchema.optional(),
    statusId: idSchema.optional(),
    scope: z.enum(['all', 'active', 'completed']).default('all'),
    search: z.string().trim().min(1).max(160).optional(),
  })
  .strict();
