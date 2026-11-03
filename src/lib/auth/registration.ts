import { createHash } from 'node:crypto';
import { APIError } from 'better-auth/api';
import type { getCurrentAdapter } from '@better-auth/core/context';

type RegistrationAdapter = Pick<
  Awaited<ReturnType<typeof getCurrentAdapter>>,
  'findOne' | 'deleteMany' | 'count'
>;
import { OWNER_INVITATION_ID } from '@/lib/auth/registration-constants';

/** Derives the database lookup digest without persisting the invitation's bearer secret. */
export function ownerInvitationIdentifier(token: string): string {
  return `owner-registration:${createHash('sha256').update(token).digest('hex')}`;
}

/** Validates the invitation, email, expiry and empty owner slot; consumption joins Better Auth's signup transaction. */
export async function requireOwnerInvitation(
  adapter: RegistrationAdapter,
  email: unknown,
  token: unknown,
  consume = false,
): Promise<void> {
  const denied = () =>
    new APIError('FORBIDDEN', {
      code: 'OWNER_REGISTRATION_CLOSED',
      message: 'Owner registration requires a valid unused invitation.',
    });
  if (
    typeof email !== 'string' ||
    typeof token !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(token)
  )
    throw denied();
  const where = [
    { field: 'id', value: OWNER_INVITATION_ID },
    { field: 'identifier', value: ownerInvitationIdentifier(token) },
    { field: 'value', value: email.toLowerCase() },
    { field: 'expiresAt', operator: 'gt' as const, value: new Date() },
  ];
  if (await adapter.count({ model: 'user' })) throw denied();
  const valid = consume
    ? (await adapter.deleteMany({ model: 'verification', where })) === 1
    : Boolean(await adapter.findOne({ model: 'verification', where }));
  if (!valid) throw denied();
}
