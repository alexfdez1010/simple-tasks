'use server';
import type { z } from 'zod';
import { requireAuthenticated } from '@/lib/auth/session';
import { reviewService } from '@/lib/coordination/reviews';
import type {
  reviewDecisionSchema,
  submitReviewSchema,
} from '@/lib/coordination/schemas';
import { executeBoardAction } from '@/lib/validation/action-result';

/** Submits the assigned owner's deliverable from the authenticated management interface. */
export async function submitReviewAction(
  input: z.input<typeof submitReviewSchema>,
) {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await reviewService.submit(input);
  });
}
/** Records the assigned reviewer's decision on the version shown in the authenticated panel. */
export async function decideReviewAction(
  input: z.input<typeof reviewDecisionSchema>,
) {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await reviewService.decide(input);
  });
}
