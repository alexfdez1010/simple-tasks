'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthenticated } from '@/lib/auth/session';
import { createApiToken, revokeApiToken } from '@/lib/api-tokens/store';
import { getErrorMessage } from '@/lib/validation/errors';

/** Creates a credential only for a signed-in owner; returns a safe result and one-time secret. */
export async function createApiTokenAction(input: unknown) {
  try {
    await requireAuthenticated();
    const data = await createApiToken(input);
    revalidatePath('/api-access');
    return { success: true as const, data };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error) };
  }
}

/** Revokes a credential only for a signed-in owner; never accepts bearer authorization. */
export async function revokeApiTokenAction(id: string) {
  try {
    await requireAuthenticated();
    await revokeApiToken(id);
    revalidatePath('/api-access');
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error) };
  }
}
