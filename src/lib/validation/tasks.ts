import { z } from 'zod';

import { idSchema, indexSchema } from '@/lib/validation/common';

const titleSchema = z.string().trim().min(1).max(160);
const descriptionSchema = z.string().trim().max(20_000).nullable();
const dateInputSchema = z.union([z.string(), z.date()]).nullable();

export const createTaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  dueDate: dateInputSchema.optional(),
  statusId: idSchema.optional(),
});

export const updateTaskSchema = z.object({
  id: idSchema,
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  dueDate: dateInputSchema.optional(),
});

export const moveTaskSchema = z.object({
  id: idSchema,
  statusId: idSchema,
  index: indexSchema,
});

export const reorderTasksSchema = z.object({
  statusId: idSchema,
  taskIds: z.array(idSchema).max(10_000),
});
