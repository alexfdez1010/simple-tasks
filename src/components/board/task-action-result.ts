import type { ActionResult } from '@/lib/validation/action-result';

/** Normalizes transport rejection so optimistic mutations can roll back just like domain failures. */
export async function taskActionResult<T>(
  operation: () => Promise<ActionResult<T>>,
  fallback: string,
): Promise<ActionResult<T>> {
  try {
    return await operation();
  } catch {
    return { success: false, error: fallback };
  }
}
