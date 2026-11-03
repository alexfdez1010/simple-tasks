import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { PrismaClient } from '@/generated/prisma';
import { ownerInvitationIdentifier } from '@/lib/auth/registration';
import { OWNER_INVITATION_ID } from '@/lib/auth/registration-constants';

/** Issues a private one-use signup invitation; replacing an incorrect owner requires its exact id. */
export async function issueOwnerInvitation(
  db: PrismaClient,
  input: { email: string; replaceOwnerId?: string },
): Promise<string> {
  const email = z.string().email().parse(input.email).toLowerCase();
  const token = randomBytes(32).toString('base64url');
  await db.$transaction(
    async (tx) => {
      const owner = await tx.user.findFirst();
      if (owner && owner.id !== input.replaceOwnerId)
        throw new Error('An owner already exists.');
      if (owner) {
        // Authentication records are separate from tasks, projects and assignees.
        await tx.oauthAccessToken.deleteMany({ where: { userId: owner.id } });
        await tx.oauthRefreshToken.deleteMany({ where: { userId: owner.id } });
        await tx.oauthConsent.deleteMany({ where: { userId: owner.id } });
        await tx.apikey.deleteMany({ where: { referenceId: owner.id } });
        await tx.apiToken.updateMany({
          where: { revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await tx.user.delete({ where: { id: owner.id } });
      }
      await tx.verification.upsert({
        where: { id: OWNER_INVITATION_ID },
        create: {
          id: OWNER_INVITATION_ID,
          identifier: ownerInvitationIdentifier(token),
          value: email,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
        update: {
          identifier: ownerInvitationIdentifier(token),
          value: email,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      });
    },
    { isolationLevel: 'Serializable', timeout: 30_000 },
  );
  return token;
}
