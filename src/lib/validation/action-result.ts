import { revalidatePath } from 'next/cache';

import { getErrorMessage } from '@/lib/validation/errors';

export type ActionResult =
  { success: true } | { success: false; error: string };

/** Executes a mutation, refreshes the board, and normalizes boundary errors. */
export async function executeBoardAction(
  operation: () => Promise<unknown>,
): Promise<ActionResult> {
  try {
    await operation();
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
