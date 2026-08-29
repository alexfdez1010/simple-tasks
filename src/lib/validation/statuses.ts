import { z } from 'zod';

import { colorSchema, idSchema } from '@/lib/validation/common';

const nameSchema = z.string().trim().min(1).max(60);

export const createStatusSchema = z.object({
  name: nameSchema,
  color: colorSchema,
  isTerminal: z.boolean().default(false),
});

export const updateStatusSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  color: colorSchema.optional(),
  isTerminal: z.boolean().optional(),
});

export const reorderStatusesSchema = z.object({
  statusIds: z.array(idSchema).min(1).max(100),
});
