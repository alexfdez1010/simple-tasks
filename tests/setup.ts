import { vi } from 'vitest';

// Needed to mock the server-only imports in Next.js
vi.mock('server-only', () => {
  return {};
});

// Background response hooks are a request-runtime boundary; suites dispatch explicitly.
vi.mock('@/lib/webhooks/schedule', () => ({
  scheduleWebhookDelivery: vi.fn(),
}));
