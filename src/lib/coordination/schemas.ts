import { z } from 'zod';
import { idSchema } from '@/lib/validation/common';

export const assigneeFields = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(['HUMAN', 'AGENT']).default('HUMAN'),
  description: z.string().max(20_000).default(''),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#64748B'),
});
export const updateAssigneeSchema = assigneeFields
  .partial()
  .extend({ id: idSchema });
export const projectFields = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(20_000).default(''),
});
export const updateProjectSchema = projectFields
  .partial()
  .extend({ id: idSchema });
export const dependencyIdsSchema = z
  .array(idSchema)
  .max(100)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    'Dependencies must be unique.',
  );
export const readyQuery = z.object({
  assigneeId: idSchema,
  projectId: idSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
});
export const startTaskSchema = z.object({ id: idSchema, assigneeId: idSchema });

export const submitReviewSchema = z.object({
  id: idSchema,
  assigneeId: idSchema,
});
export const reviewQuery = z.object({
  reviewerId: idSchema,
  limit: z.number().int().min(1).max(100).default(20),
});
export const reviewDecisionSchema = z
  .object({
    id: idSchema,
    reviewerId: idSchema,
    expectedUpdatedAt: z.string().datetime(),
    decision: z.enum(['APPROVE', 'REQUEST_CHANGES']),
    note: z.string().trim().max(20_000).optional(),
  })
  .refine(
    (input) => input.decision !== 'REQUEST_CHANGES' || Boolean(input.note),
    'Explain the requested changes.',
  );
