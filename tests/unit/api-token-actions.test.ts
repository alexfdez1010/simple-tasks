import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createApiTokenAction,
  revokeApiTokenAction,
} from '@/lib/api-tokens/actions';
import { requireAuthenticated } from '@/lib/auth/session';
import { createApiToken, revokeApiToken } from '@/lib/api-tokens/store';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ requireAuthenticated: vi.fn() }));
vi.mock('@/lib/api-tokens/store', () => ({
  createApiToken: vi.fn(),
  revokeApiToken: vi.fn(),
}));

/** Proves the credential-management boundary always requires the owner session before persistence. */
describe('token management actions', () => {
  beforeEach(() => {
    vi.mocked(requireAuthenticated).mockResolvedValue(undefined);
  });
  it('rejects creation and revocation before touching storage for anonymous callers', async () => {
    vi.mocked(requireAuthenticated).mockRejectedValue(new Error('expired'));
    expect(
      (await createApiTokenAction({ name: 'x', canWrite: true })).success,
    ).toBe(false);
    expect((await revokeApiTokenAction('id')).success).toBe(false);
    expect(createApiToken).not.toHaveBeenCalled();
    expect(revokeApiToken).not.toHaveBeenCalled();
  });
  it('returns successful revocation and safe messages for unexpected failures', async () => {
    vi.mocked(revokeApiToken).mockResolvedValue(undefined);
    expect(await revokeApiTokenAction('id')).toEqual({ success: true });
    vi.mocked(createApiToken).mockRejectedValue(
      new Error('postgres://private-secret'),
    );
    const result = await createApiTokenAction({ name: 'x', canWrite: false });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).not.toContain('private-secret');
  });
});
