import { revalidatePath } from 'next/cache';

import { translateErrorMessage } from '@/lib/i18n/error-messages';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { getErrorMessage } from '@/lib/validation/errors';

export type ActionResult<T = void> =
  { success: true; data?: T } | { success: false; error: string };

/** Executes a mutation, refreshes the board, and normalizes boundary errors. */
export async function executeBoardAction<T = void>(
  operation: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await operation();
    revalidatePath('/');
    return data === undefined ? { success: true } : { success: true, data };
  } catch (error) {
    const language = await getCurrentLanguage();
    return {
      success: false,
      error: translateErrorMessage(language, getErrorMessage(error)),
    };
  }
}
