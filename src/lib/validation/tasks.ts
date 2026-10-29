import { z } from 'zod';

import { MAX_TASK_PROPERTIES } from '@/lib/properties/limits';
import { idSchema, indexSchema } from '@/lib/validation/common';
import { taskPropertyValueInputSchema } from '@/lib/validation/properties';

import { dependencyIdsSchema } from '@/lib/coordination/schemas';

const titleSchema = z.string().trim().min(1).max(160);
const descriptionSchema = z.string().trim().max(20_000).nullable();
const dateInputSchema = z.union([z.string(), z.date()]).nullable();

export const createTaskSchema = z.object({
  title: titleSchema,
  assigneeId: idSchema.optional(),
  reviewerId: idSchema.nullable().optional(),
  projectId: idSchema.optional(),
  dependencyIds: dependencyIdsSchema.optional(),
  description: descriptionSchema.optional(),
  dueDate: dateInputSchema.optional(),
  statusId: idSchema.optional(),
  propertyValues: z
    .array(taskPropertyValueInputSchema)
    .max(MAX_TASK_PROPERTIES)
    .optional(),
});

export const updateTaskSchema = z
  .object({
    id: idSchema,
    expectedUpdatedAt: z.string().datetime().optional(),
    assigneeId: idSchema.optional(),
    reviewerId: idSchema.nullable().optional(),
    projectId: idSchema.optional(),
    dependencyIds: dependencyIdsSchema.optional(),
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    dueDate: dateInputSchema.optional(),
    statusId: idSchema.optional(),
    index: indexSchema.optional(),
    propertyValues: z
      .array(taskPropertyValueInputSchema)
      .max(MAX_TASK_PROPERTIES)
      .optional(),
  })
  .refine(
    (input) => (input.statusId === undefined) === (input.index === undefined),
    {
      message: 'Status and position must be provided together.',
      path: ['statusId'],
    },
  );

export const moveTaskSchema = z.object({
  id: idSchema,
  statusId: idSchema,
  index: indexSchema,
});

export const reorderTasksSchema = z.object({
  statusId: idSchema,
  taskIds: z.array(idSchema).max(10_000),
});
