'use server';

import { requireAuthenticated } from '@/lib/auth/session';
import { statusService } from '@/lib/statuses';
import type {
  CreateStatusInput,
  ReorderStatusesInput,
  UpdateStatusInput,
} from '@/lib/statuses/types';
import {
  executeBoardAction,
  type ActionResult,
} from '@/lib/validation/action-result';

/** Creates one customizable status at the end of the board. */
export async function createStatusAction(
  input: CreateStatusInput,
): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await statusService.create(input);
  });
}

/** Updates a status and any terminal completion metadata it controls. */
export async function updateStatusAction(
  input: UpdateStatusInput,
): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await statusService.update(input);
  });
}

/** Deletes one empty status while preserving at least one board column. */
export async function deleteStatusAction(id: string): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await statusService.delete(id);
  });
}

/** Applies an exact complete ordering to all statuses. */
export async function reorderStatusesAction(
  input: ReorderStatusesInput,
): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await statusService.reorder(input);
  });
}
