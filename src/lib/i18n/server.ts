'use server';

import { cookies } from 'next/headers';

import type { ActionResult } from '@/lib/validation/action-result';
import {
  isLanguage,
  LANGUAGE_COOKIE_MAX_AGE,
  LANGUAGE_COOKIE_NAME,
  type Language,
  resolveLanguage,
} from '@/lib/i18n/config';

/**
 * Reads and validates the current language preference from request cookies.
 *
 * @returns The stored supported language, or English when absent or invalid.
 */
export async function getCurrentLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  return resolveLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
}

/**
 * Validates and persists a language preference for the current browser.
 *
 * @param value - Candidate language value supplied by a client form or action.
 * @returns A successful language result, or a validation error without a write.
 */
export async function setLanguageAction(
  value: unknown,
): Promise<ActionResult<Language>> {
  if (!isLanguage(value)) {
    return { error: 'Unsupported language.', success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(LANGUAGE_COOKIE_NAME, value, {
    httpOnly: true,
    maxAge: LANGUAGE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return { data: value, success: true };
}
