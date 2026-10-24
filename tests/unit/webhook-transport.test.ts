import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { postWebhook } from '@/lib/webhooks/transport';

const mocks = vi.hoisted(() => ({ request: vi.fn(), resolve: vi.fn() }));
vi.mock('node:https', () => ({ request: mocks.request }));
vi.mock('@/lib/webhooks/target', () => ({
  resolveWebhookTarget: mocks.resolve,
}));

describe('webhook HTTPS transport boundary', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });
  it('uses the validated IP directly and sends signed metadata without following a redirect', async () => {
    mocks.resolve.mockResolvedValue({
      url: new URL('https://receiver.example/hook'),
      address: { address: '8.8.8.8', family: 4 },
    });
    const response = { statusCode: 302, destroy: vi.fn() };
    const req = new EventEmitter() as EventEmitter & {
      end: ReturnType<typeof vi.fn>;
      destroy: ReturnType<typeof vi.fn>;
    };
    req.end = vi.fn(() => {
      const callback = mocks.request.mock.calls[0][2];
      callback(response);
      req.emit('close');
    });
    req.destroy = vi.fn();
    mocks.request.mockReturnValue(req);
    const input = {
      url: 'https://receiver.example/hook',
      secret: 'test-secret',
      body: '{"id":"event"}',
      id: 'event',
      event: 'task.created',
    };
    expect(await postWebhook(input)).toBe(302);
    const options = mocks.request.mock.calls[0][1];
    expect(options.agent).toBe(false);
    expect(options.family).toBe(4);
    const resolved = vi.fn();
    options.lookup('receiver.example', {}, resolved);
    expect(resolved).toHaveBeenCalledWith(null, '8.8.8.8', 4);
    expect(options.headers['X-Simple-Tasks-Id']).toBe('event');
    expect(options.headers['X-Simple-Tasks-Signature']).toMatch(
      /^v1=[a-f0-9]{64}$/,
    );
    expect(req.end).toHaveBeenCalledWith(input.body);
    expect(mocks.resolve).toHaveBeenCalledOnce();
    expect(mocks.request).toHaveBeenCalledOnce();
    expect(response.destroy).toHaveBeenCalled();
  });
  it('stops an unresponsive request at the total network deadline', async () => {
    vi.useFakeTimers();
    mocks.resolve.mockResolvedValue({
      url: new URL('https://receiver.example/hook'),
      address: { address: '8.8.8.8', family: 4 },
    });
    const req = new EventEmitter() as EventEmitter & {
      end: ReturnType<typeof vi.fn>;
      destroy: ReturnType<typeof vi.fn>;
    };
    req.end = vi.fn();
    req.destroy = vi.fn(() => {
      req.emit('error', new Error('timeout'));
      req.emit('close');
    });
    mocks.request.mockReturnValue(req);
    const result = expect(
      postWebhook({
        url: 'https://receiver.example/hook',
        secret: 'secret',
        body: '{}',
        id: 'id',
        event: 'webhook.test',
      }),
    ).rejects.toThrow('DELIVERY_FAILED');
    await vi.advanceTimersByTimeAsync(5000);
    await result;
    expect(req.destroy).toHaveBeenCalledOnce();
  });
});
