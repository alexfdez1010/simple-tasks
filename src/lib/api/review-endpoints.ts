import { z } from 'zod';
import { endpoint } from '@/lib/api/endpoint';
import { reviewService } from '@/lib/coordination/reviews';
import {
  reviewDecisionSchema,
  reviewQuery,
  submitReviewSchema,
} from '@/lib/coordination/schemas';

export const reviewEndpoints = [
  endpoint(
    'GET',
    '/tasks/reviews',
    'List pending reviews for a responsible party',
    reviewQuery
      .extend({ limit: z.coerce.number().int().min(1).max(100).default(20) })
      .strict(),
    'ReadyTasks',
    (input) => reviewService.list(input),
  ),
  endpoint(
    'POST',
    '/tasks/{id}/submit-review',
    'Submit a task for optional review',
    submitReviewSchema.omit({ id: true }).strict(),
    'Task',
    (input, { id }) => reviewService.submit({ ...input, id }),
  ),
  endpoint(
    'POST',
    '/tasks/{id}/review',
    'Approve or request changes for a submitted version',
    reviewDecisionSchema.innerType().omit({ id: true }).strict(),
    'Task',
    (input, { id }) => reviewService.decide({ ...input, id }),
  ),
];
