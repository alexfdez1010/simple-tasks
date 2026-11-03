'use server';
import { redirect } from 'next/navigation';
import { destroySession } from '@/lib/auth/session';

/** Ends the active browser session and returns to login. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}
