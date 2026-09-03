'use server';

import { revalidatePath } from 'next/cache';

import { requireAuthenticated } from '@/lib/auth/session';
import { statisticsService } from '@/lib/statistics';
import type {
  CreateStatisticInput,
  ReorderStatisticsInput,
  StatisticDefinition,
  UpdateStatisticInput,
} from '@/lib/statistics/types';
import type { ActionResult } from '@/lib/validation/action-result';
import { translateErrorMessage } from '@/lib/i18n/error-messages';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { getErrorMessage } from '@/lib/validation/errors';

/** Executes an authenticated mutation and refreshes the statistics route. */
async function executeStatisticsAction<T>(
  operation: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    await requireAuthenticated();
    const data = await operation();
    revalidatePath('/statistics');
    return data === undefined ? { success: true } : { success: true, data };
  } catch (error) {
    const language = await getCurrentLanguage();
    return {
      success: false,
      error: translateErrorMessage(language, getErrorMessage(error)),
    };
  }
}

/** Creates one authenticated statistic definition. */
export async function createStatisticAction(
  input: CreateStatisticInput,
): Promise<ActionResult<StatisticDefinition>> {
  return executeStatisticsAction(() => statisticsService.create(input));
}

/** Updates one authenticated statistic definition. */
export async function updateStatisticAction(
  input: UpdateStatisticInput,
): Promise<ActionResult<StatisticDefinition>> {
  return executeStatisticsAction(() => statisticsService.update(input));
}

/** Deletes one authenticated statistic definition. */
export async function deleteStatisticAction(id: string): Promise<ActionResult> {
  return executeStatisticsAction(() => statisticsService.delete(id));
}

/** Persists the complete statistics canvas order. */
export async function reorderStatisticsAction(
  input: ReorderStatisticsInput,
): Promise<ActionResult> {
  return executeStatisticsAction(() => statisticsService.reorder(input));
}
