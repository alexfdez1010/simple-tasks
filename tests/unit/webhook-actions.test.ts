import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireAuthenticated } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  saveWebhookAction,
  revealWebhookSecretAction,
  testWebhookAction,
  retryWebhookAction,
} from '@/lib/webhooks/actions';
import {
  queueWebhookTest,
  retryWebhookDelivery,
  saveWebhookSettings,
} from '@/lib/webhooks/store';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ requireAuthenticated: vi.fn() }));
vi.mock('@/lib/db/client', () => ({
  db: { webhookEndpoint: { findUniqueOrThrow: vi.fn() } },
}));
vi.mock('@/lib/webhooks/store', () => ({
  queueWebhookTest: vi.fn(),
  retryWebhookDelivery: vi.fn(),
  saveWebhookSettings: vi.fn(),
}));
vi.mock('@/lib/webhooks/dispatcher', () => ({ dispatchWebhookBatch: vi.fn() }));

describe('owner-only webhook actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticated).mockResolvedValue(undefined);
  });
  it('requires authentication before config, reveal, test or retry touches persistence', async () => {
    vi.mocked(requireAuthenticated).mockRejectedValue(new Error('expired'));
    expect(
      (
        await saveWebhookAction({
          url: 'https://receiver.example',
          enabled: true,
        })
      ).success,
    ).toBe(false);
    expect((await revealWebhookSecretAction()).success).toBe(false);
    expect((await testWebhookAction()).success).toBe(false);
    expect((await retryWebhookAction('event')).success).toBe(false);
    expect(saveWebhookSettings).not.toHaveBeenCalled();
    expect(queueWebhookTest).not.toHaveBeenCalled();
    expect(retryWebhookDelivery).not.toHaveBeenCalled();
    expect(db.webhookEndpoint.findUniqueOrThrow).not.toHaveBeenCalled();
  });
  it('returns safe errors without revealing storage or destination details', async () => {
    vi.mocked(saveWebhookSettings).mockRejectedValue(
      new Error('https://private:secret@internal'),
    );
    const result = await saveWebhookAction({});
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).not.toContain('secret');
  });
});
