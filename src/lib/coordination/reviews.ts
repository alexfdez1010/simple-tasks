import type { z } from 'zod';
import { db } from '@/lib/db/client';
import {
  PrismaReviewRepository,
  type ReviewRepository,
} from '@/lib/coordination/review-repository';
import {
  reviewDecisionSchema,
  reviewQuery,
  submitReviewSchema,
} from '@/lib/coordination/schemas';

/** Validates optional human/agent review operations independently of their transport. */
export class ReviewService {
  /** Injects focused review persistence. */
  constructor(private readonly repository: ReviewRepository) {}
  /** Returns pending work for the requested reviewer. */
  list(input: z.input<typeof reviewQuery>) {
    return this.repository.list(reviewQuery.parse(input));
  }
  /** Sends the assigned owner's task for independent review. */
  submit(input: z.input<typeof submitReviewSchema>) {
    return this.repository.submit(submitReviewSchema.parse(input));
  }
  /** Accepts or returns the exact version the reviewer inspected. */
  decide(input: z.input<typeof reviewDecisionSchema>) {
    return this.repository.decide(reviewDecisionSchema.parse(input));
  }
}

export const reviewService = new ReviewService(new PrismaReviewRepository(db));
