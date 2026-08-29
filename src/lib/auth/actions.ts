'use server';

import { redirect } from 'next/navigation';

import { createSession, destroySession } from '@/lib/auth/session';

export type LoginState = { error: string | null };

/** Authenticates a login form and redirects successful requests to the board. */
export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get('password');
  if (typeof password !== 'string' || !(await createSession(password))) {
    return { error: 'Incorrect password.' };
  }
  redirect('/');
}

/** Ends the active browser session and returns to login. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}
