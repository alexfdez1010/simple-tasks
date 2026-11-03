import 'server-only';
import { db } from '@/lib/db/client';
import { OWNER_INVITATION_ID } from '@/lib/auth/registration-constants';

/** Exposes whether signup is available without revealing the invitation token or invited email. */
export async function isOwnerRegistrationOpen(): Promise<boolean> {
  const [owner, invitation] = await Promise.all([
    db.user.count(),
    db.verification.findUnique({
      where: { id: OWNER_INVITATION_ID },
      select: { expiresAt: true },
    }),
  ]);
  return (
    owner === 0 && Boolean(invitation && invitation.expiresAt > new Date())
  );
}
